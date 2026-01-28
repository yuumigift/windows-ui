export const generateGUID = (name: string) => {
    let hash = 0;
    if (name.length == 0) return `${hash}`;
    for (let i = 0; i < name.length; i++) {
        let char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}