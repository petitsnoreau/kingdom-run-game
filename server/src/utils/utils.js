const shuffleList = (list) => {
  return list.sort((item) => 0.5 - Math.random())
}

const getRandomNumber = (range) => {
  return Math.floor(Math.random() * range)
}

const prettifyData = (data) => {
  return JSON.stringify(data, null, 2)
}

export { shuffleList, getRandomNumber, prettifyData }
