const parse = (data) => {
  const arr = []
  Object.keys(data).forEach((key) => {
    arr.push(`${key}=${data[key]}`)
  })
  return arr.join('&')
}

const request = function ({
  url,
  method = 'post',
  onprogress = () => {},
  data,
  headers = {},
  requestList,
}) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = onprogress
    if (method === 'get') {
      url = `${url}?${parse(data)}`
    }
    xhr.open(method, url)
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key])
    })
    xhr.send(data)
    xhr.onload = (e) => {
      if (requestList) {
        const xhrIndex = requestList.findIndex((item) => item === xhr)
        if (xhrIndex >= 0) {
          requestList.splice(xhrIndex, 1)
        }
      }
      resolve({
        data: e.target.response,
      })
    }
    requestList?.push(xhr)
  })
}

export default request
