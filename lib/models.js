const models = new Map();

class Models {

	static addModel(nome, dirFile) {
		const m = models.get(nome.toLowerCase());
		if (m !== undefined) {
			throw new Error(`O model ${nome} já existe.`);
		}

		models.set(nome.toLowerCase(), dirFile);
	}

	static getModel(nome, dao) {
		const dirFile = models.get(nome.toLowerCase());
		if (dirFile === undefined) {
			throw new Error(`O model ${nome} não foi localizado.`);
		}

		const ModelItem = require(dirFile);
		return new ModelItem(dao);
	}

}

module.exports = Models;