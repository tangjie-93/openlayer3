/***鼠标移动触发的事件**/
function pointerMoveHandler(evt) {
	//显示经纬度信息
	var coordinate = evt.coordinate;
	var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
		coordinate, 'EPSG:3857', 'EPSG:4326'));

	hdms = "纬度:" + hdms.substr(0, 13) + "&nbsp" + "经度:" + hdms.substr(14);
	hdms = hdms.replace("N", "(N)").replace("S", "(S)").replace("E", "(E)").replace("W", "(W)");
	document.getElementById('lonlat').innerHTML = '<span>' + hdms + '</span>'
	var zIndex = document.getElementsByTagName('canvas')[0].style.zIndex;

	//判断是否是拖动地图
	if(evt.dragging) {
		return;
	}
	/** @type {string} **/
	var helpMsg = 'Click to start drawing';

	if(sketch) {
		//sketch是feature
		var geom = sketch.getGeometry();
		if(geom instanceof ol.geom.Polygon) {
			helpMsg = continuePolygonMsg;
		} else if(geom instanceof ol.geom.LineString) {
			helpMsg = continueLineMsg;
		}
	}
	if(helpTooltipElement && typeSelect.value !== 'None') {
		helpTooltipElement.innerHTML = helpMsg;
		helpTooltip.setPosition(evt.coordinate);
		helpTooltipElement.classList.remove('hidden');
	}
};
//程序运行第①步,添加交互的draw，绘画     
function addInteraction() {
	if(typeSelect.value == 'None' && helpTooltipElement) {
		removeLastGeometry()
		helpTooltipElement.classList.add('hidden');
		measureTooltip
	} else {
		draw = new ol.interaction.Draw({
			source: source,
			type: typeSelect.value,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 0.9)',
					lineDash: [10, 10],
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: 'rgba(255, 0, 0, 0.7)'
					}),
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.2)'
					})
				})
			})
		});
		//在地图上添加绘制的线或面
		map.addInteraction(draw);
		var listener;
		draw.on('drawstart',
			function(evt) {
				removeLastGeometry();
				// set sketch
				sketch = evt.feature;
				/** @type {ol.Coordinate|undefined} */
				var tooltipCoord = evt.coordinate;
				console.log(sketch.getGeometry().getLastCoordinate());
				//监听geometry改变事件
				listener = sketch.getGeometry().on('change', function(evt) {
					var geom = evt.target;
					var output;
					if(geom instanceof ol.geom.Polygon) {
						//获取面积
						output = formatArea(geom);
						//获取面中心点坐标
						tooltipCoord = geom.getInteriorPoint().getCoordinates();
					} else if(geom instanceof ol.geom.LineString) {
						//获取线的长度
						output = formatLength(geom);
						//获取线终点坐标
						tooltipCoord = geom.getLastCoordinate();
					} else if(geom instanceof ol.geom.Point) {
						//获取线的长度
						output = tooltipCoord;
						//获取线终点坐标
						tooltipCoord = geom.getLastCoordinate();
					}
					measureTooltipElement.innerHTML = output;
					//measureTooltip是overLay
					measureTooltip.setPosition(tooltipCoord);
				});
			}, this);
		draw.on('drawend',
			function(evt) {
				measureTooltipElement.className = 'tooltip tooltip-static';
				measureTooltip.setOffset([0, -7]);
				// unset sketch
				sketch = null;
				// unset tooltip so that a new one can be created         
				measureTooltipElement = null;
				createMeasureTooltip();
				ol.Observable.unByKey(listener);
			}, this);
		//程序运行第②步
		createMeasureTooltip();
		createHelpTooltip();
	}
}

/*** Creates a new help tooltip ****/
function createHelpTooltip() {
	if(helpTooltipElement) {
		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
	}
	helpTooltipElement = document.createElement('div');
	helpTooltipElement.className = 'tooltip hidden';
	helpTooltip = new ol.Overlay({
		element: helpTooltipElement,
		offset: [15, 0],
		positioning: 'center-left'
	});
	map.addOverlay(helpTooltip);
}

/*** Creates a new measure tooltip***/
function createMeasureTooltip() {
	if(measureTooltipElement) {
		measureTooltipElement.parentNode.removeChild(measureTooltipElement);
	}
	measureTooltipElement = document.createElement('div');
	measureTooltipElement.className = 'tooltip tooltip-measure';
	measureTooltip = new ol.Overlay({
		element: measureTooltipElement,
		offset: [0, -15],
		positioning: 'bottom-center'
	});
	map.addOverlay(measureTooltip);
}

/*** Remove the previous overLay and ToolTipDiv**/
function removeLastGeometry() {
	source.clear();
	var array = document.getElementsByClassName('tooltip tooltip-static');
	var body = document.getElementsByTagName('body')[0];
	for(var i = 0; i < array.length; i++) {
		array[i].parentNode.removeChild(array[i]);
	}
}

/**
 * Format length output.
 * @param {ol.geom.LineString} line The line.
 * @return {string} The formatted length.
 */
function formatLength(line) {
	//获取线的长度
	var length = ol.Sphere.getLength(line);
	var output;
	if(length > 100) {
		output = (Math.round(length / 1000 * 100) / 100) +
			' ' + 'km';
	} else {
		output = (Math.round(length * 100) / 100) +
			' ' + 'm';
	}
	return output;
};
/**
 * Format area output.
 * @param {ol.geom.Polygon} polygon The polygon.
 * @return {string} Formatted area.
 */
function formatArea(polygon) {
	//获取面积
	var area = ol.Sphere.getArea(polygon);
	var output;
	if(area > 10000) {
		output = (Math.round(area / 1000000 * 100) / 100) +
			' ' + 'km<sup>2</sup>';
	} else {
		output = (Math.round(area * 100) / 100) +
			' ' + 'm<sup>2</sup>';
	}
	return output;
};
/**
 * Format area output.
 * @param {ol.geom.Circle} polygon The polygon.
 * @return {string} Formatted area.
 */
function formatCircleArea(circle) {
	//获取线的长度
	var length = ol.Sphere.getLength(circle);
	var area = Math.PI * length * length;
	var output;
	if(area > 100) {
		output = (Math.round(length / 1000 * 100) / 100) +
			' ' + 'km';
	} else {
		output = (Math.round(length * 100) / 100) +
			' ' + 'm';
	}
	return output;
};

// 隐藏显示osm图层,隐藏显示point图层,隐藏显示circle图层
function checkOsm(elem) {
	console.log(elem);
	osmLayer.setVisible(elem.checked);
	pointLayer.setVisible(elem.checked);
	circleLayer.setVisible(elem.checked);
}
// 隐藏显示point图层
function checkPoint(elem) {
	pointLayer.setVisible(elem.checked);
}
// 隐藏显示circle图层
function checkCircle(elem) {
	circleLayer.setVisible(elem.checked);
}
// 置顶osm图层到最上面
function upOsm(elem) {
	anchorLayer.setZIndex(4)
	if(elem.checked) {
		osmLayer.setZIndex(3);
		circleLayer.setZIndex(circleLayer.getZIndex() - 1);
		pointLayer.setZIndex(pointLayer.getZIndex() - 1);
	}
}

// 置顶circle图层到最上面
function upCircle(elem) {
	anchorLayer.setZIndex(4)
	if(elem.checked) {
		circleLayer.setZIndex(3);
		osmLayer.setZIndex(osmLayer.getZIndex() - 1);
		pointLayer.setZIndex(pointLayer.getZIndex() - 1);
	}
}

// 置顶point图层到最上面
function upPoint(elem) {
	anchorLayer.setZIndex(3)
	if(elem.checked) {
		pointLayer.setZIndex(4);
		osmLayer.setZIndex(osmLayer.getZIndex() - 1);
		circleLayer.setZIndex(circleLayer.getZIndex() - 1);
	}
}
