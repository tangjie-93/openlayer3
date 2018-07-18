// 向左移动地图
function moveToLeft() {
	var view = map.getView();
	var mapCenter = view.getCenter();
	// 让地图中心的x值增加，即可使得地图向左移动，增加的值根据效果可自由设定
	mapCenter[0] += 50000;
	view.animate({
		center: mapCenter,
		duration: 5000,
		easing: ol.easing.easeIn
	})
	map.render();
}

// 向右移动地图
function moveToRight() {
	var view = map.getView();
	var mapCenter = view.getCenter();
	// 让地图中心的x值减少，即可使得地图向右移动，减少的值根据效果可自由设定
	mapCenter[0] -= 50000;
	view.animate({
		center: mapCenter,
		duration: 2000,
		easing: ol.easing.easeIn
	});

	map.render();
}

// 向上移动地图
function moveToUp() {
	var view = map.getView();
	var mapCenter = view.getCenter();
	// 让地图中心的y值减少，即可使得地图向上移动，减少的值根据效果可自由设定
	mapCenter[1] -= 50000;
	view.animate({
		center: mapCenter,
		duration: 5000,
		easing: ol.easing.easeIn
	})
	map.render();
}

// 向下移动地图
function moveToDown() {
	var view = map.getView();
	var mapCenter = view.getCenter();
	// 让地图中心的y值增加，即可使得地图向下移动，增加的值根据效果可自由设定
	mapCenter[1] += 50000;
	view.animate({
		center: mapCenter,
		duration: 5000,
		easing: ol.easing.easeIn
	})
	//view.setCenter(mapCenter);
	map.render();
}
// 绑定放大缩小按钮事件
function zoomIn() {
	dragZoomin.setActive(true);
	map.addInteraction(dragZoomin);
	//document.querySelector("#map").style.cursor = "default";
	document.querySelector("#map").style.cursor = "crosshair";
}

function zoomOut() {
	map.addInteraction(dragZoomout);
	dragZoomout.setActive(true);
	//document.querySelector("#map").style.cursor = "default";
	document.querySelector("#map").style.cursor = "crosshair";
}
//使框选放大、缩小失效
function setInactive() {
	document.querySelector("#map").style.cursor = "default";
	dragZoomin.setActive(false);
	dragZoomout.setActive(false);
}

function zoomBox() {
	if(document.addEventListener) {
		document.querySelector("#zoom_in").addEventListener('click', zoomIn, false);
		document.querySelector("#zoom_out").addEventListener('click', zoomOut, false);
	}
	//IE
	else {
		document.querySelector("#zoom_in").attachEvent('onclick', zoomIn, false);
		document.querySelector("#zoom_out").attachEvent('onclick', zoomOut, false);
	}

}

function init() {
	//监听鼠标移动事件
	map.on('pointermove', pointerMoveHandler);
	//	//添加鼠标离开地图事件
	map.getViewport().addEventListener('mouseout', function() {
		if(helpTooltipElement) {
			//removeLastGeometry()		
			helpTooltipElement.classList.add('hidden');
		}
	});
	$("#line").click(function() {
		removeLastGeometry();
		map.removeInteraction(draw);
		addInteraction("LineString");
		setInactive();
		map.removeLayer(vectorLayer);
	});
	$("#polygon").click(function() {
		removeLastGeometry();
		map.removeInteraction(draw);
		addInteraction("Polygon");
		setInactive();
		map.removeLayer(vectorLayer);
	})
	$("#refresh").click(function() {
		removeLastGeometry();
		map.removeInteraction(draw);
		addInteraction("None");
		setInactive();
		map.removeLayer(vectorLayer);
	});
	$("#right").click(moveToRight);
	$("#left").click(moveToLeft);
	$("#up").click(moveToUp);
	$("#down").click(moveToDown);

	//使框选放大、缩小功能失效
	map.on('click', function(evt) {
		setInactive();
		var btnnum = evt.b.button;
		if(btnnum == 2) {
			return false;
//			removeLastGeometry();
//			map.removeInteraction(draw);
//			addInteraction("None");
		}
	});
	$("#full-screen").click(setInactive);
	$(".ol-zoom-in").click(setInactive);
	$(".ol-zoom-out").click(setInactive);
	$(".ol-zoom-extent").click(setInactive);
	$(".ol-overviewmap").click(setInactive);
	if(self.fetch) {
		fetch('./data/polyline.json') .then(function(response){
			return response.json();
		}).then(function(json){			
			move(json.data);
		})
	} else {
		// 使用 XMLHttpRequest 或者其他封装框架处理
		var xhr= new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function() {
        	var data=JSON.parse(this.responseText);
            move(data);
        };
        xhr.send();
	}
	
	
}