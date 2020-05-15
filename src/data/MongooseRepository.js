
module.exports = class MongooseRepository {
    constructor({ Model }) {
        this.collection = Model
    }

    async count() {
        return this.collection.estimatedDocumentCount()
    }

    async find(query = {}, multiple = true) {
        const results = multiple
            ? this.collection.find(query)
            : this.collection.findOne(query)
        return results.exec()
    }

    async create(body) {
        const document = new this.collection(body)
        return document.save()
    }

    async update(document, body = {}) {
        const id = (typeof document._id !== 'undefined')
            ? document._id
            : document

        return this.collection.findByIdAndUpdate(id, body, { new: true, useFindAndModify: false })
    }

    async remove(document) {
        const reloadedDocument = await this.reload(document)

        return reloadedDocument.remove()
    }

    async reload(document, { select, populate, lean } = {}) {
        // Only reload if necessary
        if (!select && !populate && !lean && document instanceof this.collection) {
            return document
        }

        return (typeof document._id !== 'undefined')
            ? this.collection.findById(document._id, { select, populate, lean })
            : this.collection.findById(document, { select, populate, lean })
    }
}