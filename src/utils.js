const objMap = (obj = {}, reducer) => Object.entries(obj)
    .reduce((acc, [key, value]) => {
        acc[key] = reducer(value, key);

        return acc;
    }, {});

const objReduce = (obj = {}, reducer, inception = {}) => Object.entries(obj)
    .reduce((acc, [key, value]) => {
        const [newValue, newKey = key] = reducer(value, key);

        acc[newKey] = newValue;

        return acc;
    }, inception);

const objSumm = (obj1 = {}, obj2 = {}) => objMap(obj1, (value, key) => (value || 0) + (obj2[key] || 0));

const objConcat = (obj1 = {}, obj2 = {}) => objMap(
    obj1,
    (value, key) => value != null && obj2[key] != null ? [].concat(value, obj2[key]) : [value != null ? value : obj2[key]]
);

const objMediane = (obj) => objMap(obj, (value) => {
    const sortedValue = value.slice().sort((a, b) => a - b);
    const isCeil = sortedValue.length % 2 === 0;
    const tenPercent = Math.floor(sortedValue.length / 10);
    const center = Math.ceil((sortedValue.length - 1) / 2);
    const leftEdge = center - tenPercent;
    const rightEdge = center + tenPercent + (isCeil ? 0 : 1);
    const mediane = leftEdge === rightEdge ? sortedValue.slice(leftEdge - 1, rightEdge + 1) : sortedValue.slice(leftEdge, rightEdge);

    return mediane.reduce((summ, val) => (summ + val), 0) / (mediane.length || 1);
});

const objDevide = (obj = {}, divider) => objMap(obj, (value) => value / divider);

const objSub = (obj1 = {}, obj2 = {}) => objMap(obj1, (value, key) => (value || 0) - (obj2[key] || 0));

const objPercent = (obj1 = {}, obj2 = {}) => objMap(obj1,
    (value, key) => value && obj2[key] ? (((value) / (obj2[key])) * 100 - 100).toFixed(2) : 0
);

const objFilter = (obj, filter) => Object.entries(obj).reduce((acc, [key, value]) => {
    if (filter(key, value)) {
        acc[key] = value;
    }

    return acc;
}, {});

const escape = (number) => number > 9 ? number : `0${number}`;

const toTime = (date) => {
    const dateCopy = new Date(date);

    dateCopy.setHours(dateCopy.getHours() + dateCopy.getTimezoneOffset() / 60);

    return `${escape(dateCopy.getHours())}:${escape(dateCopy.getMinutes())}:${escape(dateCopy.getSeconds())}`
};

const toDate = (date) => {
    if (date instanceof Date) {
        return `${
            date.getFullYear()
            }.${
            escape(date.getMonth() + 1)
            }.${
            escape(date.getDate())
            } ${
            escape(date.getHours())
            }:${
            escape(date.getMinutes())
            }:${
            escape(date.getSeconds())
            }`;
    } else if (typeof date === 'number') {
        return toDate(new Date(date));
    } else {
        return date;
    }
};

const getDomain = (url) => {
    const match = url && url.match(/([^/.]+\.[^/.]+)(?:$|\/.*?$)/);

    return match && match[1];
};

const getHost = (url) => {
    const match = url && url.match(/^(https?:\/\/[^/]*?)\/?(?:$|\/.*?$)/);

    return match && match[1];
};

const isInternal = (url, page) => new RegExp(`^https?:\/\/[^/]*${(getDomain(page) || '').replace('.', '\\.')}`).test(url);

const getExtension = (url) => {
    const match = url && url.match(/https?:\/\/[^/]*?\/.*?\.([a-zA-Z0-9]+)(?:\?.*?$|$)/);

    return match && match[1]
};

const debounce = (fn, time = 1000, { start, end }) => {
    let timeout = null;

    return (...args) => {
        if (timeout) {
            clearTimeout(timeout);
        } else {
            start();
        }

        timeout = setTimeout(() => {
            fn(...args);
            end();
        }, time);
    }
};

const getType = (file) => {
    const match = file.match(/\.([^?/]*?)(\?|$)/);

    return match && match[1];
};

const compareFileNames = (firstFile, secondFile) => {
    const firstNM = firstFile.startsWith('node_modules');
    const secondNM = secondFile.startsWith('node_modules');

    if ((firstNM && secondNM) || (!firstNM && !secondNM)) {
        return firstFile.localeCompare(secondFile);
    } else if (firstNM) {
        return 1;
    } else {
        return -1;
    }
};

const parallelizeArray = (functionsArray, threads, restartTime = 0) => {
    const functionsArrayCopy = [...functionsArray];
    const completed = [];

    let completedCount = 0;
    let index = 0;
    let isStopped = false;

    const stop = () => isStopped = true;

    const execute = async (asyncFn, insertIndex, threadIndex) => {
        let complete = false;

        while (!complete && !isStopped) {
            try {
                completed[insertIndex] = await (
                    Array.isArray(threads) ? (
                        threads[threadIndex]((...args) => asyncFn(stop, ...args))
                    ) : (
                        asyncFn(stop)
                    )
                );
                completedCount++;
                complete = true;
            } catch (e) {
                await new Promise((res) => setTimeout(res, restartTime));
            }
        }
    };

    const run = async (resolve, threadIndex) => {
        while (functionsArrayCopy.length && !isStopped) {
            const asyncFn = functionsArrayCopy.shift();
            const functionIndex = index++;

            await execute(asyncFn, functionIndex, threadIndex);

            if (completedCount === functionsArray.length) {
                resolve(completed);
            }
        }

        if (isStopped) {
            resolve(completed);
        }
    };

    const promise = new Promise((resolve) => Array(Array.isArray(threads) ? threads.length : threads)
        .fill(null)
        .forEach((c, i) => run(resolve, i))
    );

    return {
        stop,
        then: (cb) => promise.then(cb)
    }
};

const parallelizeObject = (functionsObject, threads, restartTime) => {
    const keysOrder = Object.keys(functionsObject);
    const objectPlaceholder = keysOrder.reduce((acc, key) => ({ ...acc, [key]: [] }), {});

    const flattedObject = Object.entries(functionsObject)
        .reduce((acc, [key, array]) => acc.concat(array.map((fn, index) => ({ fn, key, index }))), [])
        .sort((a, b) => a.index - b.index || keysOrder.indexOf(a.key) - keysOrder.indexOf(b.key));

    const map = flattedObject.reduce((acc, { key, index }, globalIndex) => ({
        ...acc,
        [globalIndex]: {
            key,
            index
        }
    }), {});
    const functions = flattedObject.map(({ fn }) => fn);

    const { stop, then } = parallelizeArray(functions, threads, restartTime);

    return {
        stop,
        then: (cb) => then((completed) => completed
            .reduce((acc, result, globalIndex) => {
                const { key, index } = map[globalIndex];

                acc[key][index] = result;

                return acc;
            }, objectPlaceholder))
            .then(cb)
    }
};

const retry = (cb, task, timeout = 5000) => async (...args) => {
    let result;

    while (!result && (!task || task.status === 'running')) {
        try {
            result = await cb(...args);
        } catch (error) {
            if (task) {
                const response = error && error.response;
                const errorMessage = (
                    response && response.data && (
                    response.data.error && response.data.error.message ? (
                        response.data.error.message
                    ) : (
                        response.data
                    ))
                ) || (
                    error && error.config && error.config.message
                );
                const host = (
                    response && response.config && response.config.url
                ) || (
                    error && error.config && error.config.url
                );

                task.progress(`${error.stack}\nhost: ${host}\n${errorMessage}`);
            }

            await new Promise((resolve) => setTimeout(resolve, timeout))
        }
    }

    return result;
};

const memoize = (fn) => {
    const map = [];

    return (...args) => {
        const [, similarResult] = map.find(([mapArgs]) => mapArgs.every((arg, index) => arg === args[index])) || [];

        if (similarResult) {
            return similarResult;
        } else {
            const result = fn(...args);

            map.push([args, result]);

            return result;
        }
    }
};

module.exports = {
    objMap,
    objReduce,
    objDevide,
    objSumm,
    objConcat,
    objSub,
    objPercent,
    objMediane,
    objFilter,
    escape,
    toTime,
    getDomain,
    getHost,
    getExtension,
    debounce,
    toDate,
    getType,
    compareFileNames,
    isInternal,
    parallelizeArray,
    parallelizeObject,
    retry,
    memoize
};
