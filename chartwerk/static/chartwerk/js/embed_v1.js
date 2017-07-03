(function(){
    var werks = document.querySelectorAll(".chartwerk");
    for (var i = 0; i < werks.length; i++) {
        var werk = werks[i],
            id = werk.dataset.id,
            dimensions = JSON.parse(werk.dataset.embed),
            size = werk.dataset.size,
            screen = werk.parentElement.clientWidth;
        // Check if iframe already embedded. (Handles for multiple embedded charts...)
        if (werk.querySelectorAll('iframe').length < 1) {
            var iframe = document.createElement("iframe");
            iframe.setAttribute("scrolling", "no");
            iframe.setAttribute("frameborder", "0");
            // double-wide
            if (size === 'double') {
                if (screen > dimensions.double.width) {
                    iframe.setAttribute("src", "http://interactives.dallasnews.com/chartwerk/2.0/"+id+".html");
                    iframe.setAttribute("height", dimensions.double.height);
                    iframe.setAttribute("width", "100%");
                } else {
                    iframe.setAttribute("src", "http://interactives.dallasnews.com/chartwerk/2.0/"+id+"_single.html");
                    iframe.setAttribute("height", dimensions.single.height);
                    iframe.setAttribute("width", dimensions.single.width);
                }
            // single-wide
            } else {
                iframe.setAttribute("src", "http://interactives.dallasnews.com/chartwerk/2.0/"+id+"_single.html");
                iframe.setAttribute("height", dimensions.single.height);
                iframe.setAttribute("width", dimensions.single.width);
            }
            werk.appendChild(iframe);
        }
    }
})();
