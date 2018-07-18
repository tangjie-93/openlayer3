
//轨迹运动 
function move(polyline,moveTime) {
    var animating = false;
    var timer;
    var feature;
    var currentSpeed = speed = 2, index = 0, currentIndex;
    var anchorElement; //The anchor tooltip element.
    var anchor;
    //polyline:经纬度坐标
    var route = new ol.geom.LineString(polyline);
   
    var routeCoords = route.getCoordinates();
    //console.log(route1 instanceof ol.geom.LineString);
    var routeLength = routeCoords.length;
    //运动路径要素
    var routeFeature = new ol.Feature({
        type: 'route',
        geometry: route
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
        'route': new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 2,
                color: [255, 0, 0, 1]
            }),

        }),
        /*'icon': new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: 'https://openlayers.org/en/v4.6.5/examples/data/icon.png'
            })
        }),*/
        'point': new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                snapToPixel: false,
                fill: new ol.style.Fill({ color: 'white' }),
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                })
            })
        }),
        'geoMarker': new ol.style.Style({
            image: new ol.style.Circle({
                radius: 6,
                snapToPixel: false,
                fill: new ol.style.Fill({ color: 'red' }),
                stroke: new ol.style.Stroke({
                    color: 'white',
                    width: 1
                })
            })
        })
    };
    
    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [routeFeature, geoMarker, startMarker, endMarker]
        }),
        style: function (feature) {
            // hide geoMarker if animation is active
            if (animating && feature.get('type') === 'geoMarker') {
                return null;
            }
            return styles[feature.get('type')];
        }
    });
    window.vectorLayer = vectorLayer;
    window.OpenMap.addLayer(vectorLayer);
  
    //开始运动
    $("#play").click(function() {
        if (timer) {
            clearInterval(timer);
        }
        startAnimation(currentSpeed);
    });
    //暂停运动
    $("#pause").click(function() {
        if (timer) {
            clearInterval(timer);
        }
        stopAnimation();
    });

    //停止运动
    $("#stop").click(function () {
        /*vectorLayer.getSource().clear();*/
        if (anchorElement) {
            anchorElement.style.display="none";
        }
        back();
    });
    //加速运动
    $("#forward").click(function() {
        if (currentSpeed <= speed / 4) {
            currentSpeed = speed / 4;
            return;
        }
        currentSpeed = currentSpeed / 2;
        if (timer) {
            clearInterval(timer);
        }
        startAnimation(currentSpeed);

    });
    //回到起点
    function back() {
        if(timer) {
            clearInterval(timer);
        }
        animating=false;
        currentSpeed = speed;
        index = 0;
        currentIndex = 0;
        animating = false;
        var coord = routeCoords[0];
        feature = new ol.Feature(coord);						
        if(feature) {
            feature.setStyle(null);
        }
        geoMarker.getGeometry().setCoordinates(coord);
    };
    //开始运动
    function startAnimation(currentSpeed) {
        if(currentIndex + 1 >= routeLength) {
            back();
        }
        animating = true;
        // hide geoMarker
        geoMarker.setStyle(null);
        console.log(currentSpeed);
        timer = setInterval(function () {
            moveFeature();
        }, currentSpeed * 500);
    };
    //开始移动
    function moveFeature() {
        //console.log(currentSpeed);
        if(animating) {
            if(index + 1 >= routeLength||currentIndex + 1 >= routeLength) {
                back();
                return;
            }
            var currentPoint;
            if(currentIndex) {
                currentPoint = new ol.geom.Point(routeCoords[currentIndex]);
                currentIndex++;
            } else {
                currentPoint = new ol.geom.Point(routeCoords[index]);
                index++;
            }	
            //添加anchor，提示运动点的时间
            if(anchorElement) {
                anchorElement.parentNode.removeChild(anchorElement);
            }
            anchorElement = document.createElement('div');
            anchorElement.className = 'anchor anchor-move';
            anchor = new ol.Overlay({
                element: anchorElement,
                offset: [0, -25],
                positioning: 'bottom-center'
            });
            window.OpenMap.addOverlay(anchor);
           
            anchorElement.innerHTML = moveTime[index || currentIndex];
            //anchor是overLay
            anchor.setPosition(currentPoint.getCoordinates());
            if(feature) {
                //移除前面的feature
                vectorLayer.getSource().removeFeature(feature);
            }
            feature = new ol.Feature(currentPoint);
            feature.setStyle(styles.geoMarker);
            vectorLayer.getSource().addFeature(feature);
            // just in case you pan somewhere else
            /*map.getView().setCenter(currentPoint.getCoordinates());
            map.getView().setZoom(14);*/
        }
    }
    //停止运动
    function stopAnimation() {
        animating = false;
        if(!currentIndex) {
            currentIndex = index;
        }
    }

}