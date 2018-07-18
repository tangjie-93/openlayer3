$(function() {
	//用于显示比例尺
	var scaleLineControl = new ol.control.ScaleLine();
	scaleLineControl.setUnits('metric');
	//用于显示全屏
	var fullSCreenControl = new ol.control.FullScreen({
		target: document.getElementById("full-screen")
	});
	//用于绘制线、面要素
	source = new ol.source.Vector({
		wrapX: false
	});
	//用于绘制线、面要素的矢量图层
	var vector = new ol.layer.Vector({
		source: source,
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
	map = new ol.Map({
		target: 'map',
		controls: ol.control.defaults({
			attribution: false,
		}).extend([

			new ol.control.OverviewMap(),
			new ol.control.Rotate(),
			//new ol.control.Zoom(),
			new ol.control.ZoomToExtent(),
			//new ol.control.FullScreen(),
			fullSCreenControl,
			scaleLineControl

		]),

		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM()
			}),
			vector
		],
		view: new ol.View({
			center: ol.proj.transform([-50.74, -29.89], 'EPSG:4326', 'EPSG:3857'),//[-5647779.145935101, -3485528.4898040364]
			zoom: 10
		})

	});
	
	//map.on('mouseout', addHiddenClass);
	// 初始化一个拉框控件
	dragZoomout = new ol.interaction.DragZoom({
		condition: ol.events.condition.always,
		out: true, // 此处为设置拉框完成时放大还是缩小，当out为true时，为缩小，当out为false时，为放大
	});
	dragZoomin = new ol.interaction.DragZoom({
		condition: ol.events.condition.always,
		out: false, // 此处为设置拉框完成时放大还是缩小，当out为true时，为缩小，当out为false时，为放大
	});
	init();
	zoomBox();
	
})