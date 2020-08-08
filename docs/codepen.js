(function(){
    var repoLink = `<a class='repoLink' title='Go To Repo' href='https://github.com/yairEO/tagify'>
                        <img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Logo.png' alt='GitHub Repo'>
                    </a>`

    var intro = `<section class="pen-intro">
        ${repoLink}
        <h1>Tagify</h1>
    </section>`

    document.body.insertAdjacentHTML('beforeend', intro)
})()