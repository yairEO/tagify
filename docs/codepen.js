(function(){
    var repoLinkContent = `<img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Logo.png' alt='GitHub Repo'>`
    repoLinkContent = `<img src="https://github.com/yairEO/tagify/raw/master/docs/readme-header.svg" width="100%" height="160">`

    var repoLink = `<a class='repoLink' title='Go To Repo' href='https://github.com/yairEO/tagify'>
                        ${repoLinkContent}
                    </a>`

    var html = `
        <label for='checkbox-tagify-show-input'>Show original input</label>
        <input type='checkbox' id='checkbox-tagify-show-input'>
        <section class="pen-intro">
            ${repoLink}
        </section>`

    document.body.insertAdjacentHTML('afterbegin', html)
})()
