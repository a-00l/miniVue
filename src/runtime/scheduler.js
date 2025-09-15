const jobs = []
let currentPromise;
export function nextTick(fn) {
  const p = currentPromise || Promise.resolve()
  return fn ? p.then(fn) : p
}

export function queueJob(job) {
  // 1. 将所有的job（也就是update）存储到数组
  if (!jobs.length || !jobs.includes(job)) {
    jobs.push(job)
    // 2. 将所有jobs放进微队列
    queueFlush()
  }
}

function queueFlush() {
  currentPromise = Promise.resolve().then(flushJobs)
}

function flushJobs() {
  jobs.forEach(job => job())
  jobs.length = 0
  currentPromise = null
}