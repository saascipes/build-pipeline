export class SGUtils {


    static removeItemFromArray(array: any[], item: any) {
        const index = array.indexOf(item);
        if (index > -1)
            array.splice(index, 1);
    }

    static async sleep(ms: number) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        })
    }
}

