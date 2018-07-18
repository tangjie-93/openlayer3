function move(polyline) {
	var route1 = new ol.geom.LineString(polyline);
	var routeCoords = route1.getCoordinates();
	//console.log(route1 instanceof ol.geom.LineString);
	var routeLength = routeCoords.length;
	//运动路径要素
	var routeFeature = new ol.Feature({
		type: 'route',
		geometry: route1
	});
	//运动的要素
	var geoMarker = new ol.Feature({
		type: 'geoMarker',
		geometry: new ol.geom.Point(routeCoords[0])
	});
	//开始位置要素
	var startMarker = new ol.Feature({
		type: 'icon',
		geometry: new ol.geom.Point(routeCoords[0])
	});
	//结束位置要素
	var endMarker = new ol.Feature({
		type: 'icon',
		geometry: new ol.geom.Point(routeCoords[routeLength - 1])
	});

	var styles = {
		//路径的图标
		'route': new ol.style.Style({
			stroke: new ol.style.Stroke({
				width: 6,
				color: [237, 212, 0, 0.8]
			})
		}),
		//开始、结束位置的图标
		'icon': new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 1],
				src: 'https://openlayers.org/en/v4.6.4/examples/data/icon.png'
			})
		}),
		//运动的图标
		'geoMarker': new ol.style.Style({
			image: new ol.style.Circle({
				radius: 7,
				snapToPixel: false,
				fill: new ol.style.Fill({
					color: 'black'
				}),
				stroke: new ol.style.Stroke({
					color: 'white',
					width: 2
				})
			})
		})
	};

	var animating = false;
	var speed, now;
	var speedInput = document.getElementById('speed');
	var startButton = document.getElementById('start-animation');
    var center=ol.proj.transform([-50.74, -29.89], 'EPSG:4326', 'EPSG:3857');
	var vectorLayer = new ol.layer.Vector({
		source: new ol.source.Vector({
			features: [routeFeature, geoMarker, startMarker, endMarker]
		}),
		style: function(feature) {
			// hide geoMarker if animation is active
			if(animating && feature.get('type') === 'geoMarker') {
				return null;
			}
			//根据不同的要素返回不同的样式
			return styles[feature.get('type')];
		}
	});
	map.addLayer(vectorLayer);
	//要素运动函数
	function moveFeature(event) {
		var vectorContext = event.vectorContext;
		var frameState = event.frameState;

		if(animating) {
			//运动的时间
			var elapsedTime = frameState.time - now;
			// here the trick to increase speed is to jump some indexes
			// on lineString coordinates
			//速度乘以时间等于路程(点的总数)
			var index = Math.round(speed * elapsedTime / 1000);
			var second = elapsedTime / 1000;
			var movedPolyline=new ol.geom.LineString(routeCoords.slice(0,index));
             //获取线的长度
			var length = formatLength(movedPolyline);
			document.getElementById('elapsedTime').value = "已经运动了" + second + "秒,运动了"+length;
			if(index >= routeLength) {
				stopAnimation(true);
				setTimeout("document.getElementById('elapsedTime').value=''",3000);
				//document.getElementById('elapsedTime').value='';
				return;
			}            
            
			var currentPoint = new ol.geom.Point(routeCoords[index]);
			
			var feature = new ol.Feature(currentPoint);
			vectorContext.drawFeature(feature, styles.geoMarker);
		}
		// tell OpenLayers to continue the postcompose animation
		map.render();
	};

	function startAnimation() {
		if(animating) {
			stopAnimation(false);
		} else {
			animating = true;
			now = new Date().getTime();
			speed = speedInput.value;
			startButton.textContent = 'Cancel Animation';
			// hide start geoMarker
			geoMarker.setStyle(null);
			
			// just in case you pan somewhere else
			map.getView().setCenter(center);
			map.on('postcompose', moveFeature);
			map.render(); //可要可不要
		}
	}

	/**
	 * @param {boolean} ended end of animation.
	 */
	function stopAnimation(ended) {
		animating = false;
		startButton.textContent = 'Start Animation';
       
		// if animation cancelled set the marker at the beginning
		var coord = ended ? routeCoords[routeLength - 1] : routeCoords[0];
		/** @type {ol.geom.Point} */
		(geoMarker.getGeometry())
		.setCoordinates(coord);
		//remove listener
		map.un('postcompose', moveFeature);
	}

	startButton.addEventListener('click', startAnimation, false);
}