const DAO = require('./DAO');
const Types = require('./enum/types');
const Status = require('./enum/status');
const Persist = require('./enum/persist');
const GeradorSql = require('./geradorSql');
const tabelaBase = require('./tabelaBase');
const moment = require('moment');
const modelConverter = require('./modelConverter');
const dbConfig = require(__basedir + '/config/dbConfig');

class Tabela {

	constructor(config, dao, dbConfigKey = 'app') {
		const configDb = dbConfig[dbConfigKey];
		if (configDb === undefined) {
			throw new Error(`Não foi localizada a configuração para o banco de dados key: ${configKeyDb}`);
		}

		this._name = config.nome;
		this._version = config.versao;
		this._fields = tabelaBase.initFields(config.nome.toUpperCase(), config.campos);
		this._joins = config.joins !== undefined ? config.joins : undefined;
		this._verificar = config.verificar !== undefined ? config.verificar : true;
		this._dao = dao !== undefined ? dao : new DAO();
		this._replicar = configDb.replicar !== undefined ? configDb.replicar : false;
		this._codReplicar = configDb.codReplicar !== undefined ? configDb.codReplicar : '001';

		this._sqlInsert = GeradorSql.sqlInsert(this);
		this._sqlUpdate = GeradorSql.sqlUpdate(this);
		this._sqlDelete = GeradorSql.sqlDelete(this);

		this.nomeModel = this._name;

		this._nomeGerador = undefined;
		let chavePrimaria = this.getChavePrimaria();
		if (chavePrimaria !== undefined) {
			if (chavePrimaria.generatorName !== undefined) {
				this._nomeGerador = chavePrimaria.generatorName;
			} else if (chavePrimaria.autoIncrement) {
				this._nomeGerador = this._name.toUpperCase() + '_GEN';
			}
		}

		this._chavesEstrangeiras = [];
		if (config.chaveEstrangeiraConfig) {
			this._chavesEstrangeiras.push(...config.chaveEstrangeiraConfig);
		}
	}

	static get Types() {
		return Types;
	}

	static get Status() {
		return Status;
	}

	static get Persist() {
		return Persist;
	}

	//---------------------------------------------------------------------------
	// Para executar atualização no banco de dados durante
	// a inicialização do sitema, na criação ou atualização
	// da tabela no banco de dados
	//---------------------------------------------------------------------------
	async onUpdateDb(versao) {
	}
	//---------------------------------------------------------------------------
	async antesSalvar(item, status) {
	}

	async depoisSalvar(item, status) {
	}

	async onItemCarregado(item) {
	}

	validar() {
		let erros = [];

		for (let values of this._fields.values()) {
			for (let [key, campo] of values) {
				if (campo.required && campo.value === undefined) {
					erros.push(`O campo ${key} e obrigatorio!`);
				}
				if (campo.maxLength && campo.value !== undefined && campo.value !== null && campo.value.length > campo.maxLength) {
					erros.push(`O campo ${key} deve conter no maximo ${campo.maxLength} caracteres!`);
				}
				if (campo.minLength && campo.value !== undefined && campo.value !== null && campo.value.length < campo.minLength) {
					erros.push(`O campo ${key} deve conter no minimo ${campo.minLength} caracteres!`);
				}
			}
		}

		return erros;
	}

	validarDelete() {
		let erros = [];
		let chavePrimaria = this.getChavePrimaria();

		if (chavePrimaria === undefined) {
			erros.push('Não foi localizada a chave primária da tabela!');
		} else if (chavePrimaria.value === undefined || chavePrimaria.value === '') {
			erros.push(`O campo ${campo.name} e obrigatorio!`);
		} else if (chavePrimaria.type === Types.INTEGER && chavePrimaria.value == 0) {
			erros.push(`O campo ${campo.name} e obrigatorio!`);
		}

		return erros;
	}

	async salvar(dados, status) {
		await this.prepararDados(dados);

		let erros = [];
		if (status === Status.DELETE) {
			erros = this.validarDelete();
		} else {
			erros = this.validar();
		}
		if (erros.length) {
			throw Error(erros.join('\n'));
		}

		let conexaoOpen = this._dao.isConexaoOpen();

		try {
			if (!conexaoOpen) {
				await this._dao.openConexao(true);
			}

			let result = await this.prepararSql(status);
			if (result.status === Status.DELETE) {
				await this.verificarChaveEstrangeira();
			} else {
				await this.verificarUnique(result.status);
			}

			await this.antesSalvar(dados, status);

			let valores = await this._getValores(result.status);

			await this._dao.executarSql(result.sql, valores);

			await this.depoisSalvar(valores, status);

			if (!conexaoOpen) {
				await this._dao.confirmarTransacao();
			}

			return true;
		} catch (err) {
			throw Error(err);
		} finally {
			if (!conexaoOpen) {
				this._dao.closeConexao();
			}
		}
	}

	async prepararDados(dados) {
		let promises = [];

		for (let values of this._fields.values()) {
			for (let [key, campo] of values) {
				if (campo.persist !== Persist.NUNCA) {
					promises.push(await this._setFieldValue(campo, dados[key]));
				}
			}
		}

		return await Promise.all(promises);
	}

	async _setFieldValue(campo, valor) {
		campo.value = undefined;

		if (valor == undefined && campo.defaultValue !== undefined) {
			valor = campo.defaultValue;
		}

		if (valor !== undefined) {
			campo.value = await campo.setValue(campo, valor);
		}

		return true;
	}

	async prepararSql(status) {
		let sql = undefined;
		switch (status) {
			case Status.INSERT:
				sql = this._sqlInsert;
				break;
			case Status.UPDATE:
				sql = this._sqlUpdate;
				break;
			case Status.DELETE:
				sql = this._sqlDelete;
				break;
			case Status.NONE:
				let chavePrimaria = this.getChavePrimaria();
				if (!chavePrimaria) {
					throw Error('Não foi localizada a chave primária da tabela!');
				}
				if (chavePrimaria.value === undefined || chavePrimaria.value === null || chavePrimaria.value === '') {
					sql = this._sqlInsert;
					status = Status.INSERT;
				} else if (chavePrimaria.type === Types.INTEGER && chavePrimaria.value == 0) {
					sql = this._sqlInsert;
					status = Status.INSERT;
				} else {
					sql = this._sqlUpdate;
					status = Status.UPDATE;
				}
				break;
		}

		if (sql === undefined) {
			throw Error('Status inválido');
		}

		return { sql: sql, status: status };
	}

	async _getValores(status) {
		let valores = [];
		switch (status) {
			case Status.INSERT:
				valores = await this._getValoresInserir();
				break;
			case Status.UPDATE:
				valores = this._getValoresUpdate();
				break;
			case Status.DELETE:
				valores = this._getValoresDelete();
				break;
			default:
				throw Error('Erro no status da operação');
		}

		return valores;
	}

	async _getValoresInserir() {
		let valores = [];

		for (let values of this._fields.values()) {
			for (let campo of values.values()) {
				if (campo.persist === Persist.SEMPRE || campo.persist === Persist.INCLUSAO) {
					if (campo.primaryKey) {
						if (campo.autoIncrement) {
							let id = await this._dao.gerarId(this._nomeGerador);
							if (this._replicar && campo.notReplicar === undefined) {
								id = id + this._codReplicar;
							}
							campo.value = id;
							valores.push(id);
						} else if (campo.value === undefined) {
							valores.push(null);
						} else {
							valores.push(campo.value);
						}
					} else if (campo.value === undefined) {
						valores.push(null);
					} else {
						valores.push(campo.value);
					}
				}
			}
		}

		return valores;
	}

	_getValoresUpdate() {
		let valores = [];
		let chavePrimaria = undefined;

		for (let values of this._fields.values()) {
			for (let campo of values.values()) {
				if (campo.persist === Persist.SEMPRE || campo.persist === Persist.ALTERACAO) {
					if (campo.primaryKey) {
						chavePrimaria = campo;
						continue;
					}

					if (campo.value === undefined) {
						valores.push(null);
					} else {
						valores.push(campo.value);
					}
				}
			}
		}

		if (!chavePrimaria) {
			throw Error('Não foi localizada a chave primária da tabela!');
		}

		if (chavePrimaria.value === undefined) {
			throw Error('Não foi passado o valor do id!');
		} else {
			valores.push(chavePrimaria.value);
		}

		return valores;
	}

	_getValoresDelete() {
		let chavePrimaria = this.getChavePrimaria();

		if (!chavePrimaria) {
			throw Error('Não foi localizada a chave primária da tabela!');
		}

		let valores = [];

		if (chavePrimaria.value === undefined) {
			valores.push(null);
		} else {
			valores.push(chavePrimaria.value);
		}

		return valores;
	}

	async verificarUnique(status) {
		let campos = [];
		let valores = [];
		let chavePrimaria = this.getChavePrimaria();

		for (let values of this._fields.values()) {
			for (let campo of values.values()) {
				if (campo.unique) {
					campos.push(`${campo.name.toUpperCase()} = ?`);
					valores.push(campo.value);
				}
			}
		}

		if (campos.length) {
			let chave = chavePrimaria.name.toUpperCase();
			let sql = `SELECT ${chave} FROM ${this.getNome()} WHERE (${campos.join(' OR ')})`;
			if (status === Status.UPDATE) {
				sql += ` AND ${chave} <> ?`;
				valores.push(chavePrimaria.value);
			}

			let rows = await this._dao.executarSql(sql, valores);
			if (rows.length) {
				throw Error(`O registro já existe na base de dados!`);
			}
		}

		return true;
	}

	async verificarChaveEstrangeira() {
		return true;
	}

	async consultarPorId(id, fieldsConsulta) {
		if (id === undefined) {
			throw Error('Não foi informado o id!');
		}

		let chavePrimaria = tabelaBase.getChavePrimariaId(this._fields, this.getNome());
		let criterio = [
			{ [chavePrimaria.key]: id }
		]
		let sqlDados = await GeradorSql.sqlConsulta(this, fieldsConsulta, criterio, undefined);

		let conexaoOpen = this._dao.isConexaoOpen();
		try {
			if (!conexaoOpen) {
				await this._dao.openConexao(false);
			}

			let rows = await this._dao.executarSql(sqlDados.sql, sqlDados.params);
			const rowsModel = await modelConverter(rows, this._fields, this.onItemCarregado);
			return rowsModel[0];
		} catch (err) {
			throw Error(err);
		} finally {
			if (!conexaoOpen) {
				this._dao.closeConexao();
			}
		}
	}

	async consultar(config) {
		const fieldsConsulta = config ? config.fieldsConsulta : undefined;
		const criterio = config ? config.criterio : undefined;
		const orderBy = config ? config.orderBy : undefined;

		let sqlDados = await GeradorSql.sqlConsulta(this, fieldsConsulta, criterio, orderBy);

		let conexaoOpen = this._dao.isConexaoOpen();
		try {
			if (!conexaoOpen) {
				await this._dao.openConexao(false);
			}

			let rows = await this._dao.executarSql(sqlDados.sql, sqlDados.params === undefined ? undefined : sqlDados.params);
			return await modelConverter(rows, this._fields, this.onItemCarregado);
		} catch (err) {
			throw Error(err);
		} finally {
			if (!conexaoOpen) {
				this._dao.closeConexao();
			}
		}
	}

	async consultaPaginada({ first, skip, criterio, orderBy, fieldsConsulta }) {
		try {
			let totalReg = 0;
			let sqlDados = await GeradorSql.sqlConsultaPaginada(this, fieldsConsulta, criterio, orderBy);
			let consulta = sqlDados.result ? (sqlDados.result.consulta ? sqlDados.result.consulta : undefined) : undefined;
			let params = sqlDados.result ? (sqlDados.result.params ? sqlDados.result.params : undefined) : undefined;
			let sqlTotal = GeradorSql.sqlConsultaPaginadaTotal(this, consulta);

			let valores = [];
			valores.push(first);
			valores.push(first * skip);

			if (params) {
				valores = valores.concat(params);
			}

			await this._dao.openConexao(false);
			let rows = await this._dao.executarSql(sqlDados.sql, valores);
			if (rows.length > 0) {
				let rowsT = await this._dao.executarSql(sqlTotal, params);
				totalReg = parseInt(rowsT[0].COUNT, 0);
			}

			const data = await modelConverter(rows, this._fields, this.onItemCarregado);

			return { totalReg, data };
		} catch (error) {
			throw Error(error);
		} finally {
			this._dao.closeConexao();
		}
	}

	async executarSql(sql, params) {
		let conexaoOpen = this._dao.isConexaoOpen();

		try {
			if (!conexaoOpen) {
				await this._dao.openConexao(false);
			}

			return await this._dao.executarSql(sql, params);
		} catch (err) {
			throw Error(err);
		} finally {
			if (!conexaoOpen) {
				this._dao.closeConexao();
			}
		}
	}

	async prepararCriterio(criterios) {
		return await tabelaBase.prepararCriterio(this.getNome(), criterios, this._fields);
	}

	prepararOrderBy(orderBy) {
		return tabelaBase.prepararOrderBy(this.getNome(), orderBy, this._fields);
	}

	addField(tableName, name, field) {
		const fields = this._fields.get(tableName);
		if (fields === undefined) {
			throw Error(`Não foi localizado os campos para a tabela: ${tableName}!`);
		}
		tabelaBase.initField(tableName, field);
		fields.set(name, field);
	}

	getItem() {
		let item = {};

		for (let values of this._fields.values()) {
			for (let [key, campo] of values) {
				if (campo.noSelect) {
					continue;
				}

				let value = campo.value;
				if (campo.type === Types.DATE) {
					if (value === undefined || value === null) {
						item[key] = '';
					} else {
						item[key] = moment(value).format('DD/MM/YYYY');
					}
				} else {
					item[key] = value;
				}
			}
		}

		return item;
	}

	getNome() {
		return this._name.toUpperCase();
	}

	getVersao() {
		return this._version;
	}

	getCampo(nome) {
		let campos = this._fields.get(this.getNome());
		return campos.get(nome);
	}

	isVerificar() {
		return this._verificar;
	}

	getChavePrimaria() {
		return tabelaBase.getChavePrimaria(this._fields, this.getNome());
	}

	getNomeGerador() {
		return this._nomeGerador;
	}

	getChavesEstrangeiras() {
		return this._chavesEstrangeiras;
	}

	getCampos(tipo) {
		let fields = [];

		for (let values of this._fields.values()) {
			for (let campo of values.values()) {
				if (!tipo) {
					fields.push(campo);
				} else if (campo.persist === Persist.SEMPRE || campo.persist === tipo) {
					fields.push(campo);
				}
			}
		}

		return fields;
	}

	getCamposNome(tipo) {
		let camposNome = [];

		for (let values of this._fields.values()) {
			for (let campo of values.values()) {
				if (!tipo) {
					camposNome.push(campo.name.toUpperCase());
				} else if (campo.persist === Persist.SEMPRE || campo.persist === tipo) {
					camposNome.push(campo.name.toUpperCase());
				}
			}
		}

		return camposNome.join(', ');
	}

	getCamposNomeSelect(fieldsConsulta, tabelaAlias) {
		return tabelaBase.getCamposNomeSelect(this._fields, fieldsConsulta, this._name, tabelaAlias);
	}

	getCamposMap() {
		return this._fields.get(this._name);
	}

	getJoins() {
		return this._joins;
	}

	dao() {
		return this._dao;
	}

	setNomeModel(nome) {
		this.nomeModel = nome;
	}

	getNomeModel() {
		return this.nomeModel;
	}

}

module.exports = Tabela;