export function fetchValidWords() {
    const webpath = "https://raw.githubusercontent.com/khivy/wordtris/main/lexicons/Google20000.txt";
    const promise = fetch(webpath)
        .then((res) =>  res.text() )
        .then((res) => res.split('\n'));
    return wrapPromise(promise);
}

function wrapPromise(promise: Promise<string[]>): { read: () => void } {
    let status = 'pending'
    let response: any;

    const suspender = promise.then(
        (res: string[]) => {
            status = 'success'
            response = res
        },
        (err: string[]) => {
            status = 'error'
            response = err
        },
    )
    const read = () => {
        switch (status) {
            case 'pending':
                throw suspender
            case 'error':
                throw response
            default:
                return response
        }
    }
    return { read }
}
