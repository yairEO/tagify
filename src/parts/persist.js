const VERSION = 1; // current version of persisted data. if code change breaks persisted data, verison number should be bumped.
const STORE_KEY = '@yaireo/tagify/'

export const getPersistedData = id => key => {
    // if "persist" is "false", do not save to localstorage
    let customKey = '/'+key,
        persistedData,
        versionMatch = localStorage.getItem(STORE_KEY + id + '/v', VERSION) == VERSION

    if( versionMatch ){
        try{ persistedData = JSON.parse(localStorage[STORE_KEY + id + customKey]) }
        catch(err){}
    }

    return persistedData
}

export const setPersistedData = id => {
    if( !id ) return () => {};

    // for storage invalidation
    localStorage.setItem(STORE_KEY + id + '/v', VERSION)

    return (data, key) => {
        let customKey = '/'+key,
            persistedData = JSON.stringify(data)

        if( data && key ){
            localStorage.setItem(STORE_KEY + id + customKey, persistedData)
            dispatchEvent( new Event('storage') )
        }
    }
}

export const clearPersistedData = id => key => {
    const base = STORE_KEY + '/' + id + '/';

    // delete specific key in the storage
    if( key )
        localStorage.removeItem(base + key)

    // delete all keys in the storage with a specific tagify id
    else {
        for(let k in localStorage)
            if( k.includes(base) )
                localStorage.removeItem(k)
    }
}
