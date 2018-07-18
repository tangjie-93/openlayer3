//程序运行第①步,添加交互的draw，绘画     
function addInteraction(type) {
	if(type=="None"){
		removeLastGeometry()		
		helpTooltipElement=null;
		return;
	}
	if(helpTooltipElement) {
		removeLastGeometry()		
		helpTooltipElement.classList.add('hidden');
	}
	draw = new ol.interaction.Draw({
			source: source,
			type: type,
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
				//console.log(sketch.getGeometry().getCoordinates());
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
			});
		draw.on('drawend',
			function(evt) {
				var polyline=evt.feature.getGeometry().getCoordinates();				
				measureTooltipElement.className = 'tooltip tooltip-static';
				measureTooltip.setOffset([49, 0]);
				// unset sketch
				sketch = null;
				// unset tooltip so that a new one can be created         
				measureTooltipElement = null;
				//helpTooltipElement=null;
				createMeasureTooltip();
				ol.Observable.unByKey(listener);

			});
		//程序运行第②步
		createMeasureTooltip();
		createHelpTooltip();
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
