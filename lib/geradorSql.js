const Persist = require('./enum/persist');
const CriterioConsulta = require('./criterioConsulta');

module.exports = {

	sqlInsert(tabela) {
		let campos = tabela.getCampos(Persist.INCLUSAO);
		let sql = `INSERT INTO ${tabela.getNome()} (${tabela.getCamposNome(Persist.INCLUSAO)}) VALUES (`;
		let params = [];

		for (let campo of campos) {
			params.push('?');
		}

		return sql + params.join(', ') + ');';
	},

	sqlUpdate(tabela) {
		let campos = tabela.getCampos(Persist.ALTERACAO);
		let sql = `UPDATE ${tabela.getNome()} SET `;
		let chavePrimaria = undefined;
		let params = [];

		for (let campo of campos) {
			if (campo.persist === Persist.SEMPRE || campo.persist === Persist.ALTERACAO) {
				if (campo.primaryKey) {
					chavePrimaria = campo.name.toUpperCase();
				} else {
					params.push(campo.name.toUpperCase() + ' = ?');
				}
			}
		};

		if (!chavePrimaria) {
			throw Error('Não foi localizada a chave primária da tabela!');
		}

		return sql + params.join(', ') + ' WHERE ' + chavePrimaria + ' = ?;';
	},

	sqlDelete(tabela) {
		let chavePrimaria = tabela.getChavePrimaria();
		if (!chavePrimaria) {
			throw Error('Não foi localizada a chave primária da tabela!');
		}

		return `DELETE FROM ${tabela.getNome()} WHERE ${chavePrimaria.name.toUpperCase()} = ?;`;
	},

	async sqlConsulta(tabela, fieldsConsulta, criterio, orderBy) {
		const campos = tabela.getCamposNomeSelect(fieldsConsulta);
		let sql = `SELECT ${campos.campos} FROM ${tabela.getNome()}`;
		let joins = tabela.getJoins();
		if (joins !== undefined) {
			for (let sJoin of joins) {
				let jt = sJoin.join === undefined ? 'INNER' : sJoin.join;
				let s = `${jt} JOIN ${sJoin.tabela} ${sJoin.on}`;
				sql += ` ${s}`;
			}
		}
		let criterios = criterio ? CriterioConsulta(criterio) : undefined;
		let result = await tabela.prepararCriterio(criterios);
		if (result) {
			sql += ` WHERE ${result.consulta}`;
		}
		if (campos.groupBy) {
			sql += ` GROUP BY ${campos.groupBy}`
		}
		if (orderBy) {
			let strOrderBy = tabela.prepararOrderBy(orderBy);
			if (strOrderBy) {
				sql += ` ORDER BY ${strOrderBy}`;
			}
		}

		let params = undefined;
		if (result !== undefined && result.params !== undefined) {
			params = result.params;
		}

		return { sql, params };
	},

	async sqlConsultaPaginada(tabela, fieldsConsulta, criterio, orderBy) {
		const campos = tabela.getCamposNomeSelect(fieldsConsulta);
		let sql = `SELECT FIRST ? SKIP ? ${campos.campos} FROM ${tabela.getNome()}`;
		let joins = tabela.getJoins();
		if (joins !== undefined) {
			for (let sJoin of joins) {
				let jt = sJoin.join === undefined ? 'INNER' : sJoin.join;
				let s = `${jt} JOIN ${sJoin.tabela} ${sJoin.on}`;
				sql += ` ${s}`;
			}
		}
		let criterios = criterio ? CriterioConsulta(criterio) : undefined;
		let result = await tabela.prepararCriterio(criterios);
		if (result) {
			sql += ` WHERE ${result.consulta}`;
		}
		if (campos.groupBy) {
			sql += ` GROUP BY ${campos.groupBy}`
		}
		if (orderBy) {
			let strOrderBy = tabela.prepararOrderBy(orderBy);
			if (strOrderBy) {
				sql += ` ORDER BY ${strOrderBy}`;
			}
		}

		return { sql, result };
	},

	sqlConsultaPaginadaTotal(tabela, consulta) {
		let chavePrimaria = tabela.getChavePrimaria();
		if (!chavePrimaria) {
			throw Error('Não foi localizada a chave primária da tabela!');
		}

		let sql = `SELECT COUNT(${chavePrimaria.name.toUpperCase()}) FROM ${tabela.getNome()}`;
		let joins = tabela.getJoins();
		if (joins !== undefined) {
			for (let sJoin of joins) {
				let jt = sJoin.join === undefined ? 'INNER' : sJoin.join;
				let s = `${jt} JOIN ${sJoin.tabela} ${sJoin.on}`;
				sql += ` ${s}`;
			}
		}
		if (consulta) {
			sql += ` WHERE ${consulta}`;
		}

		return sql;
	}

}