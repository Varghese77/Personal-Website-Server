var version = 2;
var curr = version;

function loadArticle(num) {
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        document.getElementById(getArticleID(num)).innerHTML = xmlHttp.responseText;
    }
    xmlHttp.open("GET", '/blog_text/' + num, true);
    xmlHttp.send(null);
}

window.onload = function() {
	var textContainer = document.getElementById('posts');
	for (var i = curr; i >= 1; i--) {
		var article = document.createElement('div');
		article.setAttribute('class', 'blog-article');
		article.setAttribute('id', getArticleID(i));

		textContainer.appendChild(article);
		article.style.display = "none";
	}
	loadArticle(curr);
	document.getElementById(getArticleID(curr)).style.display = "block";
}

function next_article () {
	next = curr - 1;
	if (next >= 1){
		loadArticle(next);
		document.getElementById(getArticleID(next)).style.display = "block";
		var img = new Image();
		img.src = 'images/line_breaker.jpg';
		img.id = "line_breaker";
		document.getElementById(getArticleID(curr)).appendChild(img);
		curr--;
		if (curr === 1) {
			document.getElementById("down").style.display = "none";
		}
	}
}

function getArticleID(num) {
	return "post-" + num;
}
