var map,view,_Glayer
	require([
	  "esri/Map",
	  "esri/views/MapView",
	  "esri/Graphic",
	  "esri/layers/GraphicsLayer",
	  "esri/geometry/Point",
	  "esri/geometry/geometryEngine",
	  "esri/layers/FeatureLayer",
	  "esri/widgets/LayerList",
	  "dojo/domReady!"
	], function(Map, MapView,Graphic,GraphicsLayer,Point,geometryEngine,FeatureLayer,LayerList) {

		var handle = $( "#custom-handle" );
    	$( "#slider" ).slider(
    		{
	    		min: 0,
	    		max: 10,
	    		animate: "slow",
	    		create: function() {
			     handle.text( $( this ).slider( "value" ) );
			    },
	    		slide: function(event,ui) {
	    		 console.log(ui.value);
	    		 handle.text( ui.value );
	    		 drawbuffer();
	    		 $("#Layerlist").css("display","inline-block");
	    		},
    		});
    	$("#btnPositXY").on("click",function(){
			var _x,_y;
			_x=$("#WGS84lng").val();
			_y=$("#WGS84lat").val();
			_geometry = { "lat": _y, "lng": _x };
	        locate();
		});	
		//以下為初始化地圖
		map = new Map({
		    basemap: "streets-night-vector"
		 });
		view = new MapView({
		    container: "viewDiv",
		    map: map,
		    center: [121.533297, 25.048085],
    		zoom: 10,
		  });
		const layerList = new LayerList({
       		view: view,
        	listItemCreatedFunction: function(event) {
          	const item = event.item;
          		item.panel = {
           			content: "legend",
            		open: false
          		};
        	}
      	});
      	console.log(layerList);
      	$("#closeLayerlist").on("click",function(){
			layerList.visible=true;
		});
		view.ui.add(layerList, "top-right" );
		view.on("click", function(evt) {
			if(_mapClick== true){
		     	var _point=evt.mapPoint;
		     	_geometry = { "lat": _point.latitude, "lng": _point.longitude };
		        locate();
		        _mapClick=false;
	        }
     	});
		//以下為取得螢幕上滑鼠hover的動作來做滑鼠移動的popup
		//以下為偵測螢幕上面滑鼠移動的螢幕XY
		view.on("pointer-move", function (evt) {
		 var screenPoint = {
		   x: evt.x,
		   y: evt.y
		 };
		 var point = view.toMap({x: evt.x, y: evt.y});
		 // console.log(point); 
		 // Search for graphics at the clicked location
		 //用hitTest來轉換螢幕XY到實際座標XY，然後再用後面的Function來組出Popup的內容
		 view.hitTest(screenPoint).then(function (response) {
		  //console.log(response.results);
		  for (var i = 0; i < response.results.length; i++) {
		  	if(response.results[i].graphic.layer.id=="resultsLayer"){
		  		var _attr=response.results[i].graphic.attributes;
		  		var _graphic=response.results[i].graphic.geometry;
		  		var _content="<div>地址:"+_attr.土地區+"</div>";
		  		var _title="x:"+_attr.DDLat + ",y:"+_attr.DDLon;
		  		view.popup.open({
			   title: _title,
			   location: _graphic,
			   content: _content
			 });
		  	};		  	
		  };
		 });
		//以上為取得螢幕上滑鼠hover的動作來做滑鼠移動的popup
		});
		var _Glayer = new GraphicsLayer({
			id:"bufferLayer1",
			listMode:"hide",
		});
		var HGL = new GraphicsLayer({
			id:"HGL",
			listMode:"hide",
		});		
		//以上為初始化地圖
		// 以下為地址填入獲得XY
		//以下是視窗載入完成的起手式$(function(){})
		$(function(){
			//以下是組成點選多項目的地址的選擇，讀取如果有多個選項理的data-x跟data-y
			$(document).on("click","#resultList .address",function(){
				//document是選擇所有頁面，一旦點擊了#resultList 裡的address 就會執行下列動做
				//寫成 var _this=$(this)的原因是this這個項目返回的會是類似字串，必須要將他加入$號變成JQUERY的物件
				var _this=$(this);
				console.log(this);
				console.log(_this.data("x"),_this.data("y"));
				_geometry= {"lat":_this.data("y") ,"lng":_this.data("x")};
				locate();
			});
			//以上是組成點選多項目的地址的選擇			
			$("#btnSearch").on("click",function(){
				var _address=$("#query-input").val();
				if(_address==""){
					alert("蠢喔，沒填地址查屁阿!");
					return;
				}
				var _url="https://maps.googleapis.com/maps/api/geocode/json?address="+_address+"&key=AIzaSyDvFT3eOvji9SXf6ckH0ODYXup6E2pprNw"
					$.get(_url,function(data){
					// console.log(data.results[0].geometry.location);
					//以下判斷式為如果查詢結果筆數只有一筆就顯示經緯度 如果大於一筆就用迴圈組出列表
						if(data.results.length==1){
						_geometry={"lat":data.results[0].geometry.location.lat ,"lng":data.results[0].geometry.location.lng};
						 locate();
						 $("#resultList").css("display","none")
						}else{
							var _feature;
							var _list=$("#resultList");
						//先成立一個空的陣列當做容器，先將表頭加入 然後再用迴圈將各個地址及經緯度加入
							var _html=[];
							_html.push("<tr><th>#</th><td>哪個地址呢?</td></tr>")
							for(var i=0;i<data.results.length;i++){
								_feature=data.results[i]
								_html.push("<tr><td>"+(i+1)+"</td><td><div data-x='"+data.results[i].geometry.location.lng+"' data-y='"+data.results[i].geometry.location.lat+"' class='address'</div>"+data.results[i].formatted_address+"</td></tr>");
							}
							_list.html("").append(_html.join(""));
							$("#resultList").css("display","inline-block");
						};
					});
		});
		//以上為地址填入獲得XY
			const labelClass = { // autocasts as new LabelClass()
		        symbol: {
		          type: "text", // autocasts as new TextSymbol()
		          color: "green",
		          haloColor: "black",
		          font: { // autocast as new Font()
		            family: "playfair-display",
		            size: 12,
		            weight: "bold"
		          }
		        },
		        labelPlacement: "above-center",
		        labelExpressionInfo: {
		          expression: "123"
		        }
		    };
			var fl = new FeatureLayer({
				  url: "http://services3.arcgis.com/1iEaN7ShrrAnHGzH/arcgis/rest/services/Real_Estate_Case/FeatureServer/0",
				  id:"Real_Estate_Case_0",
				  visible:false,
				  labelingInfo: [labelClass],
				  title:"實價登錄點位資料"
				});
				fl.renderer = {
				  	type: "simple",  // autocasts as new SimpleRenderer()
				  	symbol: {
					    type: "picture-marker",  // autocasts as new SimpleMarkerSymbol()
					    url: "https://i.imgur.com/evQD3BC.png",
						width: 32,
						height: 32
				  	},
				  	visualVariables: [{
				        type: "size",
				        field: "單價_元",
				        legendOptions: {
				            title: "單價"
				        },
				        stops: [
				          {
				            value: 100000,
				            size: 10,
				            label: "<十萬"
				          },
				          {
				            value: 500000,
				            size: 15,
				            label: "<五十萬"
				          },
				          {
				            value: 900000,
				            size: 25,
				            label: "<九十萬"
				          }
				        ]
		        	}]
				};
				console.log(fl);
			var fl2 = new FeatureLayer({
				  url: "http://services3.arcgis.com/1iEaN7ShrrAnHGzH/arcgis/rest/services/Real_Estate_Case/FeatureServer/1",
				  id:"Real_Estate_Case_1",
				  visible:false,
				  title:"實價登錄各里資料"
				});
				//以下為圖層開關，給予html裡的button的class名稱:ToggleLayer，下面就是監聽畫面上ToggleLayer這個class名稱的button被點擊之後，去找尋被點擊那個按鈕的data-id，然後針對那個ID的對應塗層(ID:XXX)做圖層visible開關
				$(document).on("click",".ToggleLayer",function(){
				//document是選擇所有頁面，一旦點擊了#resultList 裡的address 就會執行下列動做
				//寫成 var _this=$(this)的原因是this這個項目返回的會是類似字串，必須要將他加入$號變成JQUERY的物件
					var _this=$(this);
					console.log(this);
					console.log(_this.data("id"));
					var _bufferLayer=map.findLayerById(_this.data("id"))
					if(_bufferLayer){
						var _flag=_bufferLayer.visible;
						_bufferLayer.visible=!_flag;
					};
				});
				//以上為圖層開關
			map.add(fl2);
			map.add(fl);
			map.add(_Glayer); // adds the layer to the map
			resultsLayer = new GraphicsLayer({
				id:"resultsLayer",
				title:"緩衝範圍"
			});
			map.add(resultsLayer);
			map.add(HGL);
			console.log(fl);
		});

		//以下function為定位與顯示位置的工具
		function locate(){
			resultsLayer.removeAll();
			var _x,_y;
				_x=_geometry.lng;
				_y=_geometry.lat;
			//以下為指定點的XY來源
				point= new Point({
				type:"point",
				latitude:_y,
				longitude:_x,
				});
			//以上為指定點的XY來源
			queryTaipeiCity(point).then(function(results){
				if(results.features.length>0){
				//以下為指定定位點的圖示			
					var Pointmarker = {
						type: "picture-marker",
						url: "http://rawmilk.dk/frontend/images/9aab6af3.eclipse-icon.png",
						width: 22,
						height: 30
						};
				//以上為指定定位點的圖示
				//以下將點位跟圖示加入到Graphic中，將該Graphic加到地圖，並縮放到該地點
				  	var pinpoint = new Graphic({
	    				geometry: point,   // Add the geometry created in step 4
					    symbol: Pointmarker,   // Add the symbol created in step 5
					  });
					var _bufferLayer=map.findLayerById("bufferLayer1")
					if(_bufferLayer){
						_bufferLayer.removeAll();
						_bufferLayer.add(pinpoint)  	
						//以上將點位跟圖示加入到Graphic中，將該Graphic加到地圖，並縮放到該地點
						view.goTo({
						  		target: pinpoint,
						  		zoom:18,			  		
						  	},
						  	{
						  	 	duration: 3000,
						  	});
				};
			$("#buffer").css("display","inline-block");
				}else{
					alert("目前不支援台北以外的地區喔");
				}
			});

		};
		//以下function為繪製buffer範圍
		function drawbuffer(){
			// if(typeof bufferArea!="undefined"){_Glayer.remove(bufferArea);}; 另一清除舊有buffer的方法		 	
		 	resultsLayer.removeAll()
		 	var distance= $("#custom-handle").text()
			buffer = geometryEngine.geodesicBuffer(point, distance, "kilometers");
			var bufferfill = {
			    type: "simple-fill",
			    outline: {
			        style: "dot"
			    }
			};
			bufferArea = new Graphic(
			{
				geometry: buffer,
				symbol: bufferfill,
			});
			_Glayer.removeAll();
			_Glayer.add(bufferArea);
			//以下為指定點的XY來源
				point= new Point({
				type:"point",
				latitude:_geometry.lat,
				longitude:_geometry.lng,
				});
			//以上為指定點的XY來源
			//以下為指定定位點的圖示			
				var Pointmarker = {
					type: "picture-marker",
					url: "http://rawmilk.dk/frontend/images/9aab6af3.eclipse-icon.png",
					width: 22,
					height: 30
					};
				//以上為指定定位點的圖示
				//以下將點位跟圖示加入到Graphic中，將該Graphic加到地圖，並縮放到該地點
			  	var pinpoint = new Graphic({
					geometry: point,   // Add the geometry created in step 4
				    symbol: Pointmarker,   // Add the symbol created in step 5
				  });
			  	_Glayer.add(pinpoint);
				view.goTo({
			  		target:  bufferArea.geometry.extent.expand(1.3),//設定地圖範圍為緩衝範圍的extent並且擴張(expand)1.3倍			  		
			  	},
			  	{
			  	 	duration: 3000	
			  	});			
		};
		//以上為顯示點的buffer範圍
		//以下為按下"點我"按鈕時開始茶與Buffer交集的點圖層和面圖層
		// 點下按鍵的時候執行兩個functions，
		// 1.對目標圖層建立一個QUERY進行查詢
		// 2.將回傳結果加上一個graphic圖到地圖
		 $(".query").on("click", function() {	 		
          queryFL().then(displayResults);
        });
		// 依據CheckBox的勾選狀態(Checked)來取得被勾選項目的value，並依此來找尋圖層的ID(value要跟ID一樣)
		function queryFL() {
			var _id=$(".layerGroup:checked").val();
			console.log(_id);
			var layer=map.findLayerById(_id);
			if(layer){				//如果找到就建立一個查詢，條件是用geometry來交集(intersect)
	  			var query = layer.createQuery();
				  query.geometry = buffer;
				  query.spatialRelationship = "intersects";
				  query.outFields=["*"];
				  return layer.queryFeatures(query); 	//將查詢結果傳回
				};
		};

		function queryTaipeiCity(_geometry) {
			var _id="Real_Estate_Case_1";
			var layer=map.findLayerById(_id);
			if(layer){				//如果找到就建立一個查詢，條件是用geometry來交集(intersect)
	  			var query = layer.createQuery();
				  query.geometry = _geometry;
				  query.spatialRelationship = "intersects";
				  query.outFields=["*"];
				  return layer.queryFeatures(query); 	//將查詢結果傳回
				};
		};
		function displayResults(results) {
			console.log(results);
          resultsLayer.removeAll();
          var _symbol;
          //判斷傳回的geometry type是啥
          if(results.geometryType=="point"){
          	  _symbol={
				type: "picture-marker",
				url: "https://static.arcgis.com/images/Symbols/Firefly/FireflyB8.png",
				width: 22,
				height: 30
            	};
          };
          if(results.geometryType=="polygon"){
          	  _symbol={
              type: "simple-fill",
            };
          };
          //以上為按下"點我"按鈕時開始查與Buffer交集的點圖層和面圖層，並把他HighLight出來
          //以下為統計buffer的平均屋齡 
          var dt= new Date();
          var _data=[];
          var _gAttr=[];
          var _sum=0,_price=0,_builtAge=0,_currentYear=dt.getFullYear();
          var features = results.features.map(function(feature) { //.map就等於for迴圈
            feature.symbol = _symbol;
            var _attr=feature.attributes;
            // console.log(_attr);
            _sum=_sum+_attr.Built_Year;//把交集到的點裡面的建造年分加總
            _gAttr.push(_attr);
            _price=_price+_attr.單價_元;
            try{
            	_builtAge=_currentYear-(_attr.Built_Year+1911);
               _data.push([_attr.OBJECTID, _builtAge ]); //為何要放進去ObjectID?
	        }catch(e){
	        	console.log(e);
	        };
            return feature;
          });
          try{          
          	  var _avg= _sum/results.features.length+1911;	//將所有的年份加總再除以撈到的筆數 
          	  var _avgPrice=Math.round((_price/results.features.length/10000)*100)/100;   
	          var BuildingAge=dt.getFullYear()-Math.round(_avg); //Math.round是四捨五入 getFullyear是取的現在年分
	          $("#statistic").css("display","block");
	          $("#avgYear").empty().append("平均屋齡</br>"+BuildingAge);
	          $("#avgPrice").empty().append("平均房價(萬元)</br>"+_avgPrice);
	      }
          catch(e){
          	console.log(e);
          }
          //以上為統計buffer的平均屋齡
        resultsLayer.addMany(features);
        //以下呼叫showChart的function
		showChart(_data,_gAttr);
       	//以上呼叫showChart的function
        }
	});
	//以上為按下"點我"按鈕時開始茶與Buffer交集的點圖層和面圖層
	//以下function為顯示Hicart點選的那個點在地圖呈現
		function highPoint(attr){
			require([
			  "esri/Graphic",
			  "esri/geometry/Point"
			], function(Graphic,Point) {
				var _x,_y;
				_x=attr.經度;
				_y=attr.緯度;
			//以下為指定點的XY來源
				point= new Point({
				type:"point",
				latitude:_y,
				longitude:_x,
				});
			//以上為指定點的XY來源
			//以下為指定定位點的圖示			
				var Pointmarker = {
					type: "picture-marker",
					url: "http://rawmilk.dk/frontend/images/9aab6af3.eclipse-icon.png",
					width: 22,
					height: 30
					};
			//以上為指定定位點的圖示
			//以下將點位跟圖示加入到Graphic中，將該Graphic加到地圖，並縮放到該地點
			  	var pinpoint = new Graphic({
    				geometry: point,   // Add the geometry created in step 4
				    symbol: Pointmarker,   // Add the symbol created in step 5
				  });
				var _HGL=map.findLayerById("HGL")
				if(_HGL){
					_HGL.removeAll();
					_HGL.add(pinpoint)  	
					//以上將點位跟圖示加入到Graphic中，將該Graphic加到地圖，並縮放到該地點
				};
			});
		};
		//以上function為顯示Hicart點選的那個點在地圖呈現
//以下為HighChart的圖表依據不同區來做顯示，故需要將Buffer交集得到的資料組出Hichart所需要的"series"
function showChart(data,attr){
	var _series=[];//把放進hichart的data先定義他是名叫_series的陣列
	var _district=[];//把buffer撈回來的資料用迴圈組出總共有幾個區
	//以下要用for迴圈組出有幾區，attr就是交集撈回來的資料
	for(i=0;i<attr.length;i++){
		if(_district.indexOf(attr[i]["鄉鎮市"])==-1){ //如果_district裡面出現"沒有"(indexOf)出現過的區名稱的時候
													  //attr[i]["鄉鎮市"]的寫法是attr第i個的鄉鎮市(JSON寫法)
			_district.push(attr[i]["鄉鎮市"]);        //將該區名稱推到_district這個陣列裡
		}; 											 //結果為_district=[大同區,內湖區,中山區]
	};
	console.log(_district);
	//以上要用for迴圈組出有幾區，attr就是交集撈回來的資料
	//以下要將HighChart中的Series裡的Data(也就是要呈現的資料，在這裡是屋齡+單價)組出
	var _seriesData=[]; //先把Data給他一個空的陣列、再把資料用迴圈填入
	var dt= new Date(); 
	var _currentYear=dt.getFullYear(); //現在的年份
	console.log(_seriesData);
	try{
		for(var j=0;j<_district.length;j++){//這個迴圈將上述組出的鄉鎮市裡的每個鄉鎮都要迴圈跑
			var _vals=[]; //將組出來的屋齡,單價放到這個陣列
			for (var i=0;i<attr.length;i++) { //這個迴圈是"如果找出前面組出來的鄉鎮裡對應到交集的feature的鄉鎮市，那就將交集回來的feature的單價跟屋齡推入_val這個陣列"
				if (_district[j]==attr[i]["鄉鎮市"]) {
					_builtAge=_currentYear-(attr[i].Built_Year+1911);
					_vals.push({
						x:attr[i].單價_元/10000,
						y:_builtAge,
						attr:attr[i],
					});
				};
			};
			_seriesData.push({
				name:_district[j],
				data:_vals
			});		
		};		
	}catch(e){
		console.log(e);
	}

	//以上要將HighChart中的Series裡的Data(也就是要呈現的資料，在這裡是屋齡+單價)組出


Highcharts.chart('container', {
    chart: {
        type: 'scatter',
        zoomType: 'xy',
        backgroundColor:'rgba(0, 0, 0, 0.5)'
    },
    title: {text: 'taipei house'},
    subtitle: {text: '台北市實價登錄'
    },
    xAxis: {
        title: {
            enabled: true,
            text: '單價元(萬)'
        },
        startOnTick: true,
        endOnTick: true,
        showLastLabel: true
    },
    yAxis: {
        title: {
            text: '屋齡(年)'
        }
    },
    legend: {
        layout: 'vertical',
        align: 'left',
        verticalAlign: 'top',
        x: 100,
        y: 70,
        floating: true,
        backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
        borderWidth: 1
    },
    plotOptions: {
        scatter: {
            marker: {
                radius: 5,
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)'
                    }
                }
            },
            states: {
                hover: {
                    marker: {
                        enabled: false
                    }
                }
            },
            tooltip: {
                headerFormat: '',
                pointFormatter:function(){ //pointFormatter是HighChart的功能
						var _attr=this.attr; //this是表格裡滑動過去的時候的那個點本身
						console.log(this.index,attr[this.index]);
						highPoint(_attr);
                		return '<b>'+ _attr.土地區 +'</b><br/>';//這是Highchart的一個功能組出表格裡的tooltip
                }
            }
        }
    },
    series:_seriesData
});


}