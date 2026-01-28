const updateCommandLine = (code, commandLine) => {
  const oldIndex = commandLine.currentIndex

  const getPreviousIndex = (history, index) => {
    if (history.length > 0) {
      if (index === -1) {
        return history.length - 1
      } else if (index > 0) {
        return index - 1
      }
    }

    return index
  }

  const getNextIndex = (history, index) => {
    if (index === -1) return -1
    if (history.length > 1) {
      if (index < history.length - 1) {
        return index + 1
      }
    }

    return index
  }

  const newIndex =
    code === 'ArrowUp'
      ? getPreviousIndex(commandLine.history, oldIndex)
      : getNextIndex(commandLine.history, oldIndex)

  return {
    ...commandLine,
    currentIndex: newIndex,
    value: oldIndex !== newIndex ? commandLine.history[newIndex] : commandLine.value,
  }
}

const addToHistory = (commandLine, command) => {
  return {
    ...commandLine,
    currentIndex: -1,
    value: '',
    history: [...commandLine.history, command],
  }
}

export { addToHistory, updateCommandLine }
