var sketch; //Currently drawn feature，@type {ol.Feature}
var helpTooltipElement; //The help tooltip element.
var helpTooltip; //Overlay to show the help messages，@type {ol.Overlay}
var measureTooltipElement; //The measure tooltip element.
var measureTooltip; //Overlay to show the measurement，@type {ol.Overlay}
var continuePolygonMsg = 'Click to continue drawing the polygon'; //Message to show when the user is drawing a polygon.
var continueLineMsg = 'Click to continue drawing the line'; //Message to show when the user is drawing a line.
var draw; // global so we can remove it later，Let user change the geometry type.
var snap;
var map; //@type {ol.map}
var modify;
var select;
var sourceLayer;
var anchor;
var coordinates;
var listener;
var radius;
var i=0;
$(function() {
	//用于绘制线、面要素
	sourceLayer = new ol.source.Vector({
		wrapX: false
	});
	//用于绘制线、面要素的矢量图层
	var vectorLayer = new ol.layer.Vector({
		source: sourceLayer,
		style: new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(255, 255, 255, 0.7)'
			}),
			stroke: new ol.style.Stroke({
				color: '#ffcc33',
				width: 2
			}),
			image: new ol.style.Circle({
				radius: 7,
				fill: new ol.style.Fill({
					color: '#ffcc33'
				})
			})
		})
	});
	var center = ol.proj.transform([113.26, 23.13], 'EPSG:4326', 'EPSG:3857')	
	map = new ol.Map({
		target: document.getElementById("map"),
		controls: ol.control.defaults({
			attribution: false,
		}).extend([
			new ol.control.OverviewMap(),					
		]),
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM()
			}),
			vectorLayer
		],
		view: new ol.View({
			center: center, //[-5647779.145935101, -3485528.4898040364]
			zoom: 10,
			minZoom: 3,
			maxZoom: 18
		})
	});	
	map.on('pointermove', pointerMoveHandler);	
	function addInteraction(type) {
		draw = new ol.interaction.Draw({
			source: sourceLayer,
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
		draw.on('drawstart',function(evt) {				
			sketch = evt.feature;				
			//监听geometry改变事件
			listener = sketch.getGeometry().on('change', function(evt) {
				var geom = evt.target;								
				var output;
				if(geom instanceof ol.geom.Polygon) {
					//获取面积
					output = formatArea(geom);
					//获取面中心点坐标
					tooltipCoord = geom.getInteriorPoint().getCoordinates();					
				} 
				if(geom instanceof ol.geom.Circle) {
					//获取面积				      
					output = formatCircleArea(geom.getRadius());
					//获取面中心点坐标
					tooltipCoord=geom.getCenter();			
				} 														
			});
		}, this);
		draw.on('drawend',function(evt) {						
			sketch = null;	
			//获取多边形坐标
			coordinates=evt.feature.getGeometry().getCoordinates();
		    evt.feature.setId(i);				   						
			deleteFeature(evt,type);
			map.removeInteraction(draw);									
			ol.Observable.unByKey(listener);						
		}, this);
	};
   
	//获取线的长度
	function formatLength(line) {		
		var length = ol.Sphere.getLength(line, {
			projection: "EPSG:3857"
		});
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
	//获取多边形的面积
	function formatArea(polygon) {		
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
	//获取圆的面积
	function formatCircleArea(radius) {
		var area = Math.PI*radius*radius;
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
	//鼠标移动事件
	function pointerMoveHandler(evt) {		
		//判断是否是拖动地图
		if(evt.dragging) {
			return;
		}
		
		var pt = turf.point(evt.coordinate);
		var poly;
		if(coordinates){
			try{
				poly = turf.polygon(coordinates);
			}
			catch{
				poly = turf.polygon(coordinates[0]);
			}
			var bool=turf.booleanPointInPolygon(pt, poly);		
			//console.log(bool);
		}				
	}
    function deleteFeature(evt){   
    		
    	//在draw结束后添加一个button，用于触发删除事件
		var anchorElement = document.createElement('button');
		anchorElement.className = 'delete';
		anchorElement.innerHTML = '删除';
		anchorElement.id=(i++);		
		anchor = new ol.Overlay({
			element: anchorElement,
			offset: [0, 30],
			positioning: 'bottom-center'
		});
		map.addOverlay(anchor);
		var coord;
		var geometry;
	    try{
	    	geometry=evt.feature.getGeometry();
	    }catch(e){
	    	geometry=evt.features.getArray()[0].getGeometry();
	    }
		if(geometry instanceof ol.geom.Polygon){
			coord=geometry.getInteriorPoint().getCoordinates();
		}	
		if(geometry instanceof ol.geom.Circle){
			coord=geometry.getCenter();
		}
		anchor.setPosition(coord);
		//删除所画图形
		anchorElement.onclick=function(){				
		//map.removeInteraction(modify);
		    map.removeInteraction(select);
			var feature=vectorLayer.getSource().getFeatureById(this.id)
			if(feature){
				vectorLayer.getSource().removeFeature(feature);
				this.parentNode.removeChild(this);
				anchorElement=null;
				//删除面积测量数据
				$(".tooltip-static."+this.id).remove();									
			}
		}
    }
	//面点击事件
	$("#polygon").click(function(){		
		if(select){
			map.removeInteraction(select);
		}
		if(modify){
			map.removeInteraction(modify);
		}
		addInteraction("Polygon");
	});	
	//圆点击事件
	$("#circle").click(function(){
		//map.removeInteraction(draw);
		//map.removeInteraction(snap);
		if(select){
			map.removeInteraction(select);
		}
		if(modify){
			map.removeInteraction(modify);
		}
		addInteraction("Circle");
	});
	$("#modify").click(function(){
		select = new ol.interaction.Select({
			wrapX: false
		});
		map.addInteraction(select);
		modify = new ol.interaction.Modify({ 
			features: select.getFeatures()
			//source:sourceLayer
		});
		map.addInteraction(modify);
		snap = new ol.interaction.Snap({ 
			source: sourceLayer,			
		});
	    map.addInteraction(snap);
	    modify.on('modifyend',function(evt){
		/*if(index||index==0){*/
			var	geom=evt.features.getArray()[0].getGeometry();	   	    		
			var output;
			if(geom instanceof ol.geom.Polygon) {
				//获取面积
				output = formatArea(geom);
				//获取面中心点坐标
				tooltipCoord = geom.getInteriorPoint().getCoordinates();					
			} 
			if(geom instanceof ol.geom.Circle) {
				//获取面积				      
				output = formatCircleArea(geom.getRadius());
				//获取面中心点坐标
				tooltipCoord=geom.getCenter();			
			} 
			
	}, this);
		
	});
	//刷新操作
	$("#refresh").click(function() {
		map.removeInteraction(draw);
		map.removeInteraction(modify);
		map.removeInteraction(select);
		vectorLayer.getSource().clear();		
		$(".ol-overlay-container.ol-selectable").remove();		
	});	
})