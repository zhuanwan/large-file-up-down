const parse = (data) => {
  const arr = []
  Object.keys(data).forEach(key => {
    arr.push(`${key}=${data[key]}`)
  })
  return arr.join('&')
}

const request = function({
  url,
  method = 'post',
  data,
  headers = {}
}) {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest()
    if (method === 'get') {
      console.log(parse(data))
      url = `${url}?${parse(data)}`
    }
    xhr.open(method, url)
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key])
    })
    xhr.send(data)
    xhr.onload = e => {
      resolve({
        data: e.target.response
      })
    }
  })
}

export default request