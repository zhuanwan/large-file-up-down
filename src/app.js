import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import bodyParser from 'body-parser'
import multiparty from 'multiparty'

const __dirname = path.resolve(path.dirname('')) // 设置 __dirname，为根目录

const port = process.env.port || 4001
const app = express()
app.use('/public', express.static(__dirname + '/src/public'))
app.use(cors({ origin: '*' }))
app.use(bodyParser.json())

app.get('/testGet', (req, res) => {
  res.send({
    message: '我是get请求',
    ...req.query,
  })
})

app.post('/testPost', (req, res) => {
  res.send({
    message: '我是post请求',
    ...req.body,
  })
})

const UPLOADS_TEMP = path.resolve(__dirname, 'src/uploads_temp') // 临时切片目录
const UPLOADS = path.resolve(__dirname, 'src/uploads') // 最终上传目录

app.post('/upload', async (req, res) => {

  if (!fs.existsSync(UPLOADS_TEMP)) {
    await fs.mkdirSync(UPLOADS_TEMP)
  }

  var form = new multiparty.Form()
  form.on('error', function (err) {
    console.log('Error parsing form: ' + err.stack)
  })
  form.parse(req, async (err, fields, files) => {
    const [chunk] = files.chunk
    const [filename] = fields.filename
    const [index] = fields.index
    const chunkDir = path.resolve(UPLOADS_TEMP, filename)

    if (!fs.existsSync(chunkDir)) {
      await fs.mkdirSync(chunkDir)
    }

    fs.rename(chunk.path, `${chunkDir}/${index}`, (err) => {
      if (err) {
        console.log(err)
      }
    })
    res.send('received')
  })
})

/**
 * 读取切片，写入
 * @param {*} path 切片地址
 * @param {*} writeStream 写入的流
 * @returns 
 */
const pipeStream = (path, writeStream) => {
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(path)
    readStream.on('end', () => {
      fs.unlinkSync(path) // 读完了一个切片，就把这个切片删除
      resolve()
    })

    readStream.pipe(writeStream)
  })
}

/**
 * 合并切片
 * @param {*} chunkDir /uploads_temp/test.jpg 文件夹
 * @param {*} dest /uploads/test.jpg 文件
 * @param {*} size 一份切片大小
 * @returns 
 */
async function mergeFileChunk(chunkDir, dest, size) {
  const chunkPaths = fs.readdirSync(chunkDir, (err) => {
    return err
  })
  // 读取文件排序
  chunkPaths.sort((a, b) => a - b)

  // 先创建一个空文件
  fs.createWriteStream(dest)

  // 往文件里面填充
  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath),
        // 指定位置创建可写流
        fs.createWriteStream(dest, {
          flags: 'r+',
          start: index * size,
        })
      )
    )
  )
  // 删除uploads_temp里面的临时目录
  fs.rmdirSync(chunkDir)
  return false
}

// 合并文件
app.post('/merge', async (req, res) => {

  if (!fs.existsSync(UPLOADS)) {
    await fs.mkdirSync(UPLOADS)
  }

  const { filename, size } = req.body
  const chunkDir = path.resolve(UPLOADS_TEMP, filename)
  const dest = path.resolve(UPLOADS, filename)

  const err = await mergeFileChunk(chunkDir, dest, size)
  if (err) {
    res.send(err)
  } else {
    res.send('merged')
  }
})

app.listen(port, () => console.log(`service listening on port: ${port}`))
