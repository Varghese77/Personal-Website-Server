function equalizeHeight(groupChildren) {
    var maxHeight = 0;
    for (i = 0; i < groupChildren.length; i++) {
        var height = groupChildren[i].offsetHeight;
        if (height > maxHeight){
            maxHeight = height;
        }
    }
    for (i = 0; i < groupChildren.length; i++) { 
        groupChildren[i].style.height = maxHeight + "px";
    }
}