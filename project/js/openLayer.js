$(function() {
	var sketch; //Currently drawn feature，@type {ol.Feature}
	var helpTooltipElement; //The help tooltip element.
	var helpTooltip; //Overlay to show the help messages，@type {ol.Overlay}
	var measureTooltipElement; //The measure tooltip element.
	var measureTooltip; //Overlay to show the measurement，@type {ol.Overlay}
	var continuePolygonMsg = 'Click to continue drawing the polygon'; //Message to show when the user is drawing a polygon.
	var continueLineMsg = 'Click to continue drawing the line'; //Message to show when the user is drawing a line.
	var draw; // global so we can remove it later，Let user change the geometry type.
	var map; //@type {ol.map}
	var source; //@type{ol.source}
	var center;
	var dragZoomout; //@type{ol.interaction}
	var dragZoomin; //@typoe{ol.interaction}
	var vectorLayer; //@type{ol.layer}
	var openStreetMap;
	var tiandituLayer;
	var tiandituLabel;
	var tiandituSatelliteLayer;
	var tiandituSatelliteLabel;
	var openLayer = {
		initMap: function() {

			openStreetMap = new ol.layer.Tile({
				source: new ol.source.OSM()
			})
			tiandituLayer = openLayer.LoadtianDituLayer("vec_c");
			tiandituLabel = openLayer.LoadtianDituLayer("cva_c");
			tiandituSatelliteLayer = new ol.layer.Tile({
				source: new ol.source.XYZ({
					url: 'http://t3.tianditu.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}' //天地图影像  
				}),
				projection: 'EPSG:3857'
			})

			tiandituSatelliteLabel = new ol.layer.Tile({
				source: new ol.source.XYZ({
					url: 'http://t3.tianditu.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}' //天地图影像 标注  
				}),
				projection: 'EPSG:3857'
			})
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
			center=ol.proj.transform([113.26, 23.13], 'EPSG:4326', 'EPSG:3857')
			map = new ol.Map({
				target: document.getElementById("map"),
				controls: ol.control.defaults({
					attribution: false,
				}).extend([
					new ol.control.OverviewMap(),
					new ol.control.Rotate(),
					//new ol.control.Zoom(),
					new ol.control.ZoomToExtent(),

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

					center: center, //[-5647779.145935101, -3485528.4898040364]
					zoom: 10,
					minZoom:3,
					maxZoom:18
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
			this.init();
			this.displayContinue();
		},
		init: function() {
			var _this = this;
			//监听鼠标移动事件
			map.on('pointermove', this.pointerMoveHandler);
			//	//添加鼠标离开地图事件
			map.getViewport().addEventListener('mouseout', function() {
				if(helpTooltipElement) {
					//removeLastGeometry()		
					helpTooltipElement.classList.add('hidden');
				}
			});
			$("#line").click(function() {
				_this.removeLastGeometry();
				map.removeInteraction(draw);
				_this.addInteraction("LineString");
				_this.setInactive();
				map.removeLayer(vectorLayer);
			});
			$("#polygon").click(function() {
				_this.removeLastGeometry();
				map.removeInteraction(draw);
				_this.addInteraction("Polygon");
				_this.setInactive();
				map.removeLayer(vectorLayer);
			})
			$("#refresh").click(function() {
				_this.removeLastGeometry();
				map.removeInteraction(draw);
				_this.addInteraction("None");
				_this.setInactive();
				map.removeLayer(vectorLayer);
			});
			$("#right").click(function() {
				_this.moveToRight();
				_this.setInactive()

			});
			$("#left").click(function() {
				_this.moveToLeft();
				_this.setInactive()

			});
			$("#up").click(function() {
				_this.moveToUp();
				_this.setInactive()

			});
			$("#down").click(function() {
				_this.moveToDown();
				_this.setInactive()

			});

			//使框选放大、缩小功能失效
			map.on('click', function(evt) {
				_this.setInactive();
				var btnnum = evt.b.button;
				if(btnnum == 2) {
					_this.removeLastGeometry();
					map.removeInteraction(draw);
					_this.addInteraction("None");
				}
			});
			$("#full-screen").click(this.setInactive);
			$(".ol-zoom-in").click(this.setInactive);
			$(".ol-zoom-out").click(this.setInactive);
			$(".ol-zoom-extent").click(this.setInactive);
			$(".ol-overviewmap").click(this.setInactive);
			if(self.fetch) {
				fetch('./data/polyline.json').then(function(response) {
					return response.json();
				}).then(function(json) {
					//this.move(json.data);
				})
			} else {
				// 使用 XMLHttpRequest 或者其他封装框架处理
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url);
				xhr.onload = function() {
					var data = JSON.parse(this.responseText);
					//this.move(data);
				};
				xhr.send();
			}

			if(document.addEventListener) {
				$("#zoom_in").click(this.zoomIn);
				$("#zoom_out").click(this.zoomOut);
				//			document.getElementById("#zoom_in").onclick(this.zoomIn);
				//			document.getElementById("#zoom_out").onclick(this.zoomOut);
				//			document.getElementById("#zoom_in").addEventListener('click', this.zoomIn, false);
				//			document.getElementById("#zoom_out").addEventListener('click', this.zoomOut, false);
				//			document.querySelector("#zoom_in").addEventListener('click', zoomIn, false);
				//			document.querySelector("#zoom_out").addEventListener('click', zoomOut, false);
			}
			//IE
			else {
				document.querySelector("#zoom_in").attachEvent('onclick', this.zoomIn, false);
				document.querySelector("#zoom_out").attachEvent('onclick', this.zoomOut, false);
			}
			$(document).keydown(function(event) {
				if(event.keyCode == 27) {
					$("#refresh").click();
				}
			})
			$("#satelliteMap").click(function() {
				openLayer.changeMapType(tiandituSatelliteLayer, tiandituSatelliteLabel);
				$("#currentMap").attr('src', "../img/map_type_satellite.png");
				$(this).css('display', 'none').siblings().css('display', 'inline-block')

				map.getView().setCenter(center);
			});
			$("#commonMap").click(function() {
				openLayer.changeMapType(openStreetMap);
				$("#currentMap").attr('src', "../img/map_type_normal.png");
				$(this).css('display', 'none').siblings().css('display', 'inline-block')
				map.getView().setCenter(center);
			});
			$("#vectorMap").click(function() {
				openLayer.changeMapType(tiandituLayer, tiandituLabel);
				$("#currentMap").attr('src', "../img/map_type_vector.png");
				$(this).css('display', 'none').siblings().css('display', 'inline-block')
				map.getView().setCenter(center);

			});
			// 下面把上面的图标附加到地图上，需要一个ol.Overlay
			var anchor = new ol.Overlay({
				element: document.getElementById('anchor')
			});
			
			// 关键的一点，需要设置附加到地图上的位置
			anchor.setPosition(center);
			// 然后添加到map上
			map.addOverlay(anchor);
			$("#anchor").click(function(event) {
				var x = event.clientX;
				var y = event.clientY;
				$("#popup").css({
					'left': x + 15,
					'top': y - 25,
					'display': 'block'
				});
			})
			$("#popup-closer").click(function() {
				$("#popup").css('display', 'none');
				return false;
			});
		},
		LoadtianDituLayer:function(t) {
			var url = 'http://t3.tianditu.com/DataServer?T=' + t + '&X={x}&Y={y}&L={z}';
			var projection = ol.proj.get('EPSG:4326');
			var projectionExtent = [-180, -90, 180, 90];
			var maxResolution = (ol.extent.getWidth(projectionExtent) / (256 * 2));
			var resolutions = new Array(16);
			for(var z = 0; z < 16; ++z) {
				resolutions[z] = maxResolution / Math.pow(2, z);
			}
			var tileOrigin = ol.extent.getTopLeft(projectionExtent);
			var layer = new ol.layer.Tile({
				source: new ol.source.TileImage({
					tileUrlFunction: function(tileCoord) {
						var z = tileCoord[0] + 1;
						var x = tileCoord[1];
						var y = -tileCoord[2] - 1;
						var n = Math.pow(2, z + 1);
						x = x % n;
						if(x * n < 0) {
							x = x + n;
						}
						return url.replace('{z}', z.toString())
							.replace('{y}', y.toString())
							.replace('{x}', x.toString())
					},
					projection: projection,
					tileGrid: new ol.tilegrid.TileGrid({
						origin: tileOrigin,
						resolutions: resolutions,
						tileSize: 256
					})
				})
			});
			return layer;
		},
		displayContinue: function() {
			$("#current_map_type").mouseenter(function() {
				$("#map_type").stop();
				$("#map_type").show("slow");

			}).mouseleave(function() {
				$("#map_type").stop();
				$("#map_type").hide("slow");
			})
			$("#map_type").mouseover(function() {
				$(this).stop()
				$(this).show("slow");
			}).mouseout(function() {
				$(this).stop();
				$(this).hide("slow");
			});
		},

		changeMapType: function(layer1, layer2) {
			map.getLayers().clear();
			if(layer1) {
				map.addLayer(layer1);
			}
			if(layer2) {
				map.addLayer(layer2);
			}
			console.log(map.getLayers().getLength());
		},
		// 向左移动地图
		moveToLeft: function() {
			var view = map.getView();
			var mapCenter = view.getCenter();
			// 让地图中心的x值增加，即可使得地图向左移动，增加的值根据效果可自由设定
			mapCenter[0] += 50000;
			
			view.animate({
				center: mapCenter,
				duration: 50000,
				easing: ol.easing.easeIn(0.5)
			});
			console.log(map.getSize())
			map.render();
		},

		// 向右移动地图
		moveToRight: function() {
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
		},

		// 向上移动地图
		moveToUp: function() {
			var view = map.getView();
			var mapCenter = view.getCenter();
			// 让地图中心的y值减少，即可使得地图向上移动，减少的值根据效果可自由设定
			mapCenter[1] -= 50000;
			view.animate({
				center: mapCenter,
				duration: 5000,
				easing: ol.easing.easeIn
			});
			map.render();
		},

		// 向下移动地图
		moveToDown: function() {
			var view = map.getView();
			var mapCenter = view.getCenter();
			// 让地图中心的y值增加，即可使得地图向下移动，增加的值根据效果可自由设定
			mapCenter[1] += 50000;
			view.animate({
				center: mapCenter,
				duration: 5000,
				easing: ol.easing.easeIn
			});
			//view.setCenter(mapCenter);
			map.render();
		},
		// 绑定放大缩小按钮事件
		zoomIn: function() {
			dragZoomin.setActive(true);
			map.addInteraction(dragZoomin);
			//document.querySelector("#map").style.cursor = "default";
			document.querySelector("#map").style.cursor = "crosshair";
		},

		zoomOut: function() {
			map.addInteraction(dragZoomout);
			dragZoomout.setActive(true);
			//document.querySelector("#map").style.cursor = "default";
			document.querySelector("#map").style.cursor = "crosshair";
		},
		//使框选放大、缩小失效
		setInactive: function() {
			document.querySelector("#map").style.cursor = "default";
			dragZoomin.setActive(false);
			dragZoomout.setActive(false);
		},
		//	zoomBox: function() {
		//		if(document.addEventListener) {
		//			document.querySelector("#zoom_in").addEventListener('click', zoomIn, false);
		//			document.querySelector("#zoom_out").addEventListener('click', zoomOut, false);
		//		}
		//		//IE
		//		else {
		//			document.querySelector("#zoom_in").attachEvent('onclick', zoomIn, false);
		//			document.querySelector("#zoom_out").attachEvent('onclick', zoomOut, false);
		//		}
		//
		//	},
		//程序运行第①步,添加交互的draw，绘画     
		addInteraction: function(type) {
			if(type == "None") {
				this.removeLastGeometry();
				helpTooltipElement = null;
				return;
			}
			if(helpTooltipElement) {
				this.removeLastGeometry();
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
			var _this = this;
			//程序运行第②步
			_this.createMeasureTooltip();
			_this.createHelpTooltip();
			var listener;

			draw.on('drawstart',
				function(evt) {
					_this.removeLastGeometry();
					// set sketch
					sketch = evt.feature;
					/** @type {ol.Coordinate|undefined} */
					var tooltipCoord = evt.coordinate;
					//console.log(sketch.getGeometry().getCoordinates());
					//监听geometry改变事件
					listener = sketch.getGeometry().on('change', function(evt) {
						var geom = evt.target;
						//console.log(geom.getCoordinates());
						var output;
						if(geom instanceof ol.geom.Polygon) {
							//获取面积
							output = _this.formatArea(geom);
							//获取面中心点坐标
							tooltipCoord = geom.getInteriorPoint().getCoordinates();
						} else if(geom instanceof ol.geom.LineString) {
							//获取线的长度
							output = _this.formatLength(geom);
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
				}, window);
			draw.on('drawend',
				function(evt) {
					measureTooltipElement.className = 'tooltip tooltip-static';
					measureTooltip.setOffset([49, 0]);
					// unset sketch
					sketch = null;
					// unset tooltip so that a new one can be created         
					measureTooltipElement = null;
					//helpTooltipElement=null;
					_this.createMeasureTooltip();
					ol.Observable.unByKey(listener);

				}, window);

		},

		/*** Creates a new help tooltip ****/
		createHelpTooltip: function() {
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
		},

		/*** Creates a new measure tooltip***/
		createMeasureTooltip: function() {
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
		},

		/*** Remove the previous overLay and ToolTipDiv**/
		removeLastGeometry: function() {
			source.clear();
			var array = document.getElementsByClassName('tooltip tooltip-static');
			var body = document.getElementsByTagName('body')[0];
			for(var i = 0; i < array.length; i++) {
				array[i].parentNode.removeChild(array[i]);
			}
		},

		/**
		 * Format length output.
		 * @param {ol.geom.LineString} line The line.
		 * @return {string} The formatted length.
		 */
		formatLength: function(line) {
			//获取线的长度
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
		},
		/**
		 * Format area output.
		 * @param {ol.geom.Polygon} polygon The polygon.
		 * @return {string} Formatted area.
		 */
		formatArea: function(polygon) {
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
		},
		/**
		 * Format area output.
		 * @param {ol.geom.Circle} polygon The polygon.
		 * @return {string} Formatted area.
		 */
		formatCircleArea: function(circle) {
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
		},
		pointerMoveHandler: function(evt) {
			//显示经纬度信息
			if(evt.dragging) {
				return;
			}

			var coordinate = evt.coordinate;
			var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
				coordinate, 'EPSG:3857', 'EPSG:4326'));

			hdms = "纬度:" + hdms.substr(0, 13) + "&nbsp" + "经度:" + hdms.substr(14);
			hdms = hdms.replace("N", "(N)").replace("S", "(S)").replace("E", "(E)").replace("W", "(W)");
			document.getElementById('lonlat').innerHTML = '<span>' + hdms + '</span>';
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
			if(helpTooltipElement) {
				helpTooltipElement.innerHTML = helpMsg;
				helpTooltip.setPosition(evt.coordinate);
				helpTooltipElement.classList.remove('hidden');
			}
		}
	}
	openLayer.initMap();
})