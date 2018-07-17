console.log("site.js");
var _mapClick=false;
function formInit(){
	console.log("formInit")

	$("#optionArea :radio").on("click",function(){
		var _this=$(this);
		var _id=_this.data("id");
		$("#addressArea, #xyArea,#locationArea").hide();
		$("#"+_id).show();

		_mapClick=false;
		if(_id=="locationArea"){
			_mapClick=true;
		}
	});

	$("#optionArea :radio:checked").click();

	//---------------------------------
	
}


