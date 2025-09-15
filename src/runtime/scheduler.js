const jobs = []
export function queueJob(job) {
  // 1. 将所有的job（也就是update）存储到数组
  if (!jobs.length || !jobs.includes(job)) {
    jobs.push(job)
    // 2. 将所有jobs放进微队列
    queueFlush()
  }
}

function queueFlush() {
  Promise.resolve().then(flushJobs)
}

function flushJobs() {
  jobs.forEach(job => job())
  jobs.length = 0
}