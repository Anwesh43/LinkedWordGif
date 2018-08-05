const w = 500, h = 500
const Canvas = require('Canvas')
const GifEncoder = require('gifencoder')
class State {
    constructor() {
        this.scale = 0
        this.dir = 0
        this.prevScale = 0
    }

    update(cb) {
        this.scale += this.dir * 0.1
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class WordNode {
    constructor(i, words) {
        this.i = i
        this.state = new State()
        this.word = words[i]
        this.addNeighbor(words)
    }

    addNeighbor(words) {
        if (this.i < words.length) {
            this.next = new WordNode(this.i + 1, words, n)
            this.next.prev = this
        }
    }

    draw(context) {
        const tSize = context.measureText(this.word)
        const sc1 = Math.min(0.5, this.state.scale) * 2
        const sc2 = Math.min(0.5, Math.max(0, this.state.scale - 0.5)) * 2
        const x = w/2 - tSize / 2
        context.save()
        context.translate(x * sc1, h/2 + (h / 2 + tSize) * sc2)
        context.fillStyle = 'white'
        context.font = context.font.replace(/\d{2}/, `${Math.min(w, h) / 20}`)
        context.fillText(this.word, 0, tSize/4)
        context.restore()
    }

    update(cb) {
        this.state.update(cb)
    }

    startUpdating() {
        this.state.startUpdating()
    }

    getNext(dir, cb) {
        var curr = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class LinkedWordList {

    constructor(words) {
        this.curr = new WordNode(0, words)
        this.dir = 1
        this.curr.startUpdating()
    }

    draw(context) {
        this.curr.draw(context)
    }

    update(cb) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            if (this.curr.i == 0) {
                cb()
            } else {
                this.curr.startUpdating()
            }
        })
    }
}

class Renderer {

    constructor(words) {
        this.running = true
        this.wordList = new LinkedWordList(words)
    }

    render(context, cb, endcb) {
        while (this.running) {
            context.fillStyle = '#212121'
            context.fillRect(0, 0, w, h)
            this.wordList.draw(context)
            cb(context)
            this.wordList.update(() => {
                this.running = false
                endcb()
            })
        }
    }
}

class LinkedWordGif {
    constructor(fn, words) {
        this.renderer = new Renderer(words)
        this.canvas = new Canvas(w, h)
        this.gifencoder = new GifEncoder(w, h)

    }

    initEncoder(fn) {
        this.gifencoder.createReadStream().pipe(require('fs').createWriteStream(fn))
        this.gifencoder.setRepeat(0)
        this.gifencoder.setDelay(60)
        this.context = this.canvas.getContext('2d')
    }

    create() {
        this.gifencoder.start()
        this.renderer.render(this.context, (ctx) => {
            this.gifencoder.addFrame(ctx)
        }, () => {
            this.gifencoder.end()
        })
    }

    static init(words, fn) {
        const gif = new LinkedWordGif(fn, words)
        gif.create()
    }
}

module.exports = LinkedWordGif.init
