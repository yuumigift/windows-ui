export const Jump = () => {

    const setMaxHeight = (height: number) => {
        s.maxHeight = height
    }

    const s = reactive({
        name: 'Jump',
        maxHeight: 1,
        setMaxHeight
    })
    return s
}