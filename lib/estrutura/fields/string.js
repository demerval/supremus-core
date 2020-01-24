const Types = require('../../enum/types');
const setStringValue = require('./functions/setString');

/**
 * Modulo para dados String
 * 
 * @module string
 */
module.exports = {

    /**
     * String
     * 
     * @param {String} fieldName Valor padrão 'nome'
     * @param {int} tamanho Valor padrão '60'
     */
    string(fieldName = 'nome', tamanho = 60, config) {
        return {
            name: fieldName,
            type: Types.STRING,
            maxLength: tamanho,
            setValue: setStringValue,
            ...config,
        }
    },
    
    /**
     * String
     * 
     * @param {String} fieldName Valor padrão 'nome'
     * @param {int} tamanho Valor padrão '60'
     */
    string(fieldName = 'nome', tamanho = 60, config) {
        return {
            name: fieldName,
            type: Types.STRING,
            maxLength: tamanho,
            setValue: setStringValue,
            ...config,
        }
    },

    /**
     * String com preenchimento obrigatório
     * 
     * @param {String} fieldName Valor padrão 'nome' 
     * @param {int} tamanho Valor padrão '60'
     */
    stringRequired(fieldName = 'nome', tamanho = 60) {
        return {
            name: fieldName,
            type: Types.STRING,
            required: true,
            maxLength: tamanho,
            setValue: setStringValue
        }
    },

    /**
     * String com preenchimento obrigatório e não pode ser duplicado
     * 
     * @param {String} fieldName Valor padrão 'nome' 
     * @param {int} tamanho Valor padrão '60'
     */
    stringRequiredUnique(fieldName = 'nome', tamanho = 60) {
        return {
            name: fieldName,
            type: Types.STRING,
            required: true,
            unique: true,
            maxLength: tamanho,
            setValue: setStringValue
        }
    },

    /**
     * Blob
     * 
     * @param {String} fieldName 
     */
    blob(fieldName, alias) {
        return {
            name: fieldName,
            alias: alias === undefined ? fieldName : alias,
            type: Types.BLOB,
            setValue: setStringValue
        }
    },

    /**
     * Blob com preenchimento obrigatório
     * 
     * @param {String} fieldName 
     */
    blobRequired(fieldName, alias) {
        return {
            name: fieldName,
            alias: alias === undefined ? fieldName : alias,
            type: Types.BLOB,
            required: true,
            setValue: setStringValue
        }
    },

}