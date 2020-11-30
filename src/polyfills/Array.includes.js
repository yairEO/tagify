if (!Array.prototype.includes) {
    Array.prototype.includes = function(search){
        return !!~this.indexOf(search)
    }
}