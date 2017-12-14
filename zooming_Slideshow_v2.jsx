//グローバル変数を定義
    var mn_ScreenGlitchData = new Object();
    mn_ScreenGlitchData.scriptName = "SG";
    mn_ScreenGlitchData.scriptTitle = mn_ScreenGlitchData.scriptName + "v1.1";
    
    //文字列を定義
    mn_ScreenGlitchData.strScreenGlitchCompNamePrefix = "色収差";
    mn_ScreenGlitchData.strErrNoCompSel = "コンポジションが選択されていません．色収差を適用させたいコンポジションをプロジェクトパネルから選び，再度挑戦してみてください．";
    mn_ScreenGlitchData.strErrMoreThan1Sel = "選択できるのは一つのレイヤーのみです．";
    mn_ScreenGlitchData.strErrNeed2DLayers = "選択しているレイヤーが2Dモードか確認してください．";


//LightLeakを作る関数
 function lightLeak(){
	 
}

{
//ステップ1:選択した写真の枚数分Setコンポを作成する
	function makeSets(numImage){
		//プロジェクトが存在するか確認
        if(app.project === null){
            return;
		}		
		
		var n = app.project.selection.length;
		if(numImage == 0){
			//forループを回す前に，Constructorコンポを作成しておく
			Const = app.project.items.addComp("Constructor", 1920, 1080, 1.0, 45, 29.97);
			//プロジェクトパネルに新しいフォルダを作成する
			//var setFolder = app.project.items.addFolder("Set Comp");
			//var imgFolder = app.project.items.addFolder("image Comp");
		}
	
		//グローバル変数numImageは，これまでに作成したSetコンポの数を格納
		for(var i=numImage; i<n+numImage; i++){
			//Setコンポの名前を定義
			var setPrefix = "Set";
			var setString = setPrefix+(i+1);
			//SetComp = new Array();
			
			//選択した写真の枚数分Setコンポを作成
			setComp = app.project.items.addComp(setString, 1920, 1080, 1.0, 5.0, 29.97);
			//SetComp[i] = setComp;
			//SetコンポをSetフォルダーに格納
			//setComp.parentFolder = setFolder;
			
			//選択した写真をimg配列に格納
			var img = new Array();
			img[i] = app.project.selection[i-numImage];
			
			//img配列の写真を1枚ずつSetコンポに格納
			var imgLay = setComp.layers.add(img[i]);
			
			//写真が画面いっぱいに収まるようにscale値を取得
			var imgAspect = imgLay.width / imgLay.height;
			var compAspect = 1920 /1080;
			if(imgAspect>compAspect){
				var scale = 1080 / imgLay.height;
			}else{
				var scale = 1920 / imgLay.width;
			}
			imgLay.property("ADBE Transform Group").property("ADBE Scale").setValue([100*scale, 100*scale]);
			
			//imgレイヤーの名前を定義
			var imgPrefix = "Photo";
			var imgString = imgPrefix+(i+1);
			
			//imgレイヤーをプリコンポーズ
			var imgComp = setComp.layers.precompose([imgLay.index], imgString, true);
			var imgLayer = setComp.layer(imgString);
			imgLayer.motionBlur = true;
			setComp.motionBlur = true;
			//imgコンポをimgフォルダーに格納
			//imgComp.parentFolder = imgFolder;
			
			//imgレイヤーを3Dモードに
			imgLayer.threeDLayer = true;
			imgLayer.property("ADBE Transform Group").property("ADBE Position").setValue([960,540,2532]);
			imgLayer.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(-11.0);
		
			//imgレイヤーを複製し，背景に
			var bgLayer = imgLayer.duplicate();
			bgLayer.moveToEnd();
		
			//背景のimgレイヤーにブラーを適用
			bgLayer.property("ADBE Transform Group").property("ADBE Scale").setValue([228, 228, 228]);
			var blurFX = bgLayer.property("ADBE Effect Parade").addProperty("ブラー(滑らか)");
			blurFX["ブラー"].setValue(10.0);
	
			//前面のimgレイヤーにマスクを適用
			var myShape = new Shape();
			myShape.vertices = [[140, 50], [1830, 50], [1830, 1000], [140, 1000]];
			myShape.closed = true;
			var myMask = imgLayer.property("ADBE Mask Parade").addProperty("mask");
			myMask.maskShape.setValue(myShape);
			myMask["マスクの境界のぼかし"].setValue([230, 230]);
		
			//カメラレイヤーを作成する
			var camLayer = setComp.layers.addCamera("Cam", [0,0]);
			camLayer.property("ADBE Transform Group").property("ADBE Position").setValue([0,0,-1866.7]);
			camLayer.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(1866.7);
			camLayer.property("ADBE Camera Options Group").property("ADBE Camera Depth of Field").setValue(true);
			camLayer.property("ADBE Camera Options Group").property("絞り").setValue(17.7);
		
			//カメラ制御用ヌルレイヤーを作成する
			var nullLayer = setComp.layers.addNull();
			nullLayer.name = "Camera Control";
			nullLayer.threeDLayer = true;
		
			//カメラレイヤーをヌルレイヤーの子に設定（※パラメータを変化させずに親子関係を結ぶ）
			camLayer.setParentWithJump(nullLayer);
		
			//ヌルレイヤー（カメラの動き）にキーフレームを打つ
			//位置の次元を分割し，イーズをカスタマイズする
			nullLayer.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = true;
			var nullPos = nullLayer.property("ADBE Transform Group").property("Z 位置");
			
			nullPos.setValueAtTime(0.0,0);
			nullPos.setValueAtTime(1.0,2567);
			nullPos.setValueAtTime(2.3, 4000);
		
			nullPos.setInterpolationTypeAtKey(1,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
			var ek1 = new KeyframeEase(0,33.3);
			var ek2 = new KeyframeEase(5038.94,25.17);
			nullPos.setTemporalEaseAtKey(1, [ek1], [ek2]);
		
			nullPos.setInterpolationTypeAtKey(2,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
			var ek3 = new KeyframeEase(86.74, 100);
			var ek4 = new KeyframeEase(86.74, 100);
			nullPos.setTemporalEaseAtKey(2, [ek3], [ek4]);
	
			nullPos.setInterpolationTypeAtKey(3,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
			var ek5 = new KeyframeEase(-43.70, 35.07);
			var ek6 = new KeyframeEase(0, 33.3);
			nullPos.setTemporalEaseAtKey(3, [ek5], [ek6]);
		
			//Z回転にキーフレームを打つ
			var nullRot = nullLayer.property("ADBE Transform Group").property("Z 回転");
		
			if(i%3==0||i%3==1){
				nullRot.setValueAtTime(0.0, 5.0);
			}else{
				nullRot.setValueAtTime(0.0, -28.4);
			}
		
			nullRot.setValueAtTime(1.0, -11.6);

			if(i%3==0){
				nullRot.setValueAtTime(2.3, -28.4);
			}else if(i%3==1){
				nullRot.setValueAtTime(2.3, 11.6);
			}else{
				nullRot.setValueAtTime(2.3, 5);
			}
				
			nullRot.setInterpolationTypeAtKey(1,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
			var fk1 = new KeyframeEase(0,33.3);
			var fk2 = new KeyframeEase(0,33.3);
			nullRot.setTemporalEaseAtKey(1, [fk1], [fk2]);
		
			nullRot.setInterpolationTypeAtKey(2,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
			var fk3 = new KeyframeEase(0, 100);
			var fk4 = new KeyframeEase(0, 100);
			nullRot.setTemporalEaseAtKey(2, [fk3], [fk4]);
	
			nullRot.setInterpolationTypeAtKey(3,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
			var fk5 = new KeyframeEase(0, 33.3);
			var fk6 = new KeyframeEase(0, 33.3);
			nullRot.setTemporalEaseAtKey(3, [fk5], [fk6]);
		
			//Particles平面を作成
			var particleLayer = setComp.layers.addSolid([0,0,0], "Particles", setComp.width, setComp.height, setComp.pixelAspect, setComp.duration);
			particleLayer.moveToBeginning();
			var particleFX = particleLayer.property("ADBE Effect Parade").addProperty("CC Particle World");
			particleFX["Birth Rate"].setValue(1);
			particleFX["Radius X"].setValue(0.325);
			particleFX["Radius Y"].setValue(0.325);
			particleFX["Radius Z"].setValue(1.185);
			particleFX["Animation"].setValue(6);
			particleFX["Velocity"].setValue(0.17);
			particleFX["Gravity"].setValue(-0.020);
			particleFX["Extra"].setValue(0);
			particleFX["Extra Angle"].setValue(0);
			particleFX["Particle Type"].setValue(5);
			particleFX["Birth Size"].setValue(0.052);
			particleFX["Death Size"].setValue(0.034);
			particleFX["Birth Color"].setValue([1.0, 1.0, 1.0]);
			particleFX["Death Color"].setValue([1.0, 1.0, 1.0]);
		
			var particleOpa = particleLayer.property("ADBE Transform Group").property("ADBE Opacity");
			
			particleOpa.setValueAtTime(0.2, 0);
			particleOpa.setValueAtTime(0.6, 50);
			
			//ConstructorコンポにSetコンポを格納していく
			var setLayer = Const.layers.add(setComp);
			setLayer.startTime = i*2;
	
			var setOpa = setLayer.property("ADBE Transform Group").property("ADBE Opacity");
		
			setOpa.setValueAtTime(0+i*2, 0);
			setOpa.setValueAtTime(1/3+i*2, 100);	
		}
	}
	
	function makeMain(){
		//プリコンポーズ用のフォルダを作成する
		//var preFolder = app.project.items.addFolder("preComp");
		
		//ステップ3:Constructor Compコンポを作成する
		var constComp = app.project.items.addComp("Constructor Comp", 1920, 1080, 1.0, 45, 29.97);
		//Const.parentFolder = preFolder;
		//constComp.parentFolder = preFolder;
		
		var constB = constComp.layers.add(Const);
		constB.name = "Constructor_B"
		var constG = constB.duplicate();
		constG.name = "constructor_G";
		var constR = constG.duplicate();
		constR.name = "constructor_R";
		var constOrig = constR.duplicate();
		constOrig.name = "constructor_Orig";
		
		var rFX = constR.property("ADBE Effect Parade").addProperty("チャンネル設定");
		rFX["ソース3に青を設定"].setValue(10);
		rFX["ソース2に緑を設定"].setValue(10);
		constR.property("ADBE Transform Group").property("ADBE Scale").setValue([101, 101]);
		
		var gFX = constG.property("ADBE Effect Parade").addProperty("チャンネル設定");
		gFX["ソース1に赤を設定"].setValue(10);
		gFX["ソース3に青を設定"].setValue(10);
		constG.property("ADBE Transform Group").property("ADBE Scale").setValue([100.5, 100.5]);
		
		var bFX = constB.property("ADBE Effect Parade").addProperty("チャンネル設定");
		bFX["ソース1に赤を設定"].setValue(10);
		bFX["ソース2に緑を設定"].setValue(10);
		constB.property("ADBE Transform Group").property("ADBE Position").setValue([962, 540]);
		constB.property("ADBE Transform Group").property("ADBE Scale").setValue([102, 102]);
		
		constR.blendingMode = BlendingMode.ADD;
		constG.blendingMode = BlendingMode.ADD;
		
		var shapeLayer = constComp.layers.addShape();
		shapeLayer.name = "matte 1";
		shapeLayer.moveToBeginning();
		var shapeProperty = shapeLayer.property("ADBE Root Vectors Group");
		var shapePath = shapeProperty.addProperty("ADBE Vector Shape - Ellipse");
		shapePath["サイズ"].setValue([1720,940]);
		var shapeFill = shapeProperty.addProperty("ADBE Vector Graphic - Fill");
		shapeFill["不透明度"].setValue(100);
		var shapeBlur = shapeLayer.property("ADBE Effect Parade").addProperty("ブラー(ガウス)");
		shapeBlur["ブラー"].setValue(150);
	
		constOrig.trackMatteType = TrackMatteType.ALPHA;
		
	
		//ステップ4:Main Compositionを作成する
		var mainComp = app.project.items.addComp("Main Composition", 1920, 1080, 1.0, 45, 29.97);
		var constCompLayer = mainComp.layers.add(constComp);
		constCompLayer.property("ADBE Transform Group").property("ADBE Scale").setValue([109.3, 109.3]);
		
		var transform = mainComp.layers.addSolid([0,0,0], "Transform", mainComp.width, mainComp.height, mainComp.pixelAspect, mainComp.duration);
		transform.adjustmentLayer = true;
		var colorGrading = mainComp.layers.addSolid([0,0,0], "Color Grading", mainComp.width, mainComp.height, mainComp.pixelAspect, mainComp.duration);
		colorGrading.adjustmentLayer = true;
		var vignette = mainComp.layers.addSolid([0,0,0], "Vignette", mainComp.width, mainComp.height, mainComp.pixelAspect, mainComp.duration);
	
		var shapeLayer1 = mainComp.layers.addShape();
		shapeLayer1.name = "matte 1";
		shapeLayer1.moveBefore(vignette);
		var shapeProperty = shapeLayer1.property("ADBE Root Vectors Group");
		var shapePath = shapeProperty.addProperty("ADBE Vector Shape - Ellipse");
		shapePath["サイズ"].setValue([1870,1090]);
		var shapeFill = shapeProperty.addProperty("ADBE Vector Graphic - Fill");
		shapeFill["不透明度"].setValue(100);
		var shapeBlur = shapeLayer1.property("ADBE Effect Parade").addProperty("ブラー(ガウス)");
		shapeBlur["ブラー"].setValue(350);

		vignette.trackMatteType = TrackMatteType.ALPHA_INVERTED;
		vignette.blendingMode = BlendingMode.OVERLAY;
		
		var lensFX = transform.property("ADBE Effect Parade").addProperty("レンズ補正");
		lensFX["視界"].setValue(18);
		lensFX["レンズディストーションを反転"].setValue(true);
		
	}

	function editDuration(){
		var time = parseInt(duration.text);
		var sec = time / Const.frameRate;
		var num = Const.layers.length;
		for(var i=0; i<num; i++){
			Const.layer(i+1).startTime = (num-i-1)*sec;
		}
		for(var j=1; j<=app.project.items.length; j++){
			if(app.project.items[j].name.match(/Set/)){
				var editKey1 = app.project.items[j].layer(2).property("ADBE Transform Group").property("Z 位置");
				var editKey2 = app.project.items[j].layer(2).property("ADBE Transform Group").property("Z 回転");

				editKey2.addKey(sec+0.3);
				editKey1.removeKey(3);
				editKey2.removeKey(3);
				editKey1.setValueAtTime(sec+0.3, 4000);
				editKey1.setInterpolationTypeAtKey(3,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
				var ek5 = new KeyframeEase(-43.70, 35.07);
				var ek6 = new KeyframeEase(0, 33.3);
				editKey1.setTemporalEaseAtKey(3, [ek5], [ek6]);

				editKey2.setInterpolationTypeAtKey(3,KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
				var fk5 = new KeyframeEase(0, 33.3);
				var fk6 = new KeyframeEase(0, 33.3);
				editKey2.setTemporalEaseAtKey(3, [fk5], [fk6]);
			}
		}
	}

	function mainUI(thisObj){
		function buildUI(thisObj){
			if(thisObj instanceof Panel){
				var myPanel = thisObj;
			}else{
				var myPanel = new Window("palette", "Screen Glitch", undefined, {resizeable:true});
			}

			myPanel.btn = myPanel.add("button",undefined, "実行");
			myPanel.adBtn = myPanel.add("button", undefined, "写真を追加");
			myPanel.add("statictext", undefined, "写真1枚あたりのデュレーションを変更(60以上推奨)");
			duration = myPanel.add("edittext", [20, 20, 80, 40], "60");
			myPanel.add("statictext", undefined, "フレーム単位で入力してください．");
			myPanel.editBtn = myPanel.add("button", undefined, "デュレーションを変更");

			//実行ボタンが押されたときの挙動を制御
			myPanel.btn.onClick = function (){
				app.beginUndoGroup(mn_ScreenGlitchData.scriptName);
				numImage=0;
				makeSets(0);
				makeMain();
				app.endUndoGroup();
			}
		
			//追加ボタンを押したときの挙動を制御
			myPanel.adBtn.onClick = function (){
				app.beginUndoGroup(mn_ScreenGlitchData.scriptName);
				var num = Const.layers.length;
				makeSets(num);
				app.endUndoGroup();
			}
		
			//変更ボタンを押したときの挙動を制御
			myPanel.editBtn.onClick = function (){
				app.beginUndoGroup(mn_ScreenGlitchData.scriptName);
				editDuration();
				app.endUndoGroup();
			}
         
			myPanel.layout.layout(true);
			
			return myPanel;
		}

		var myPalette = buildUI(thisObj);
		if(myPalette != null && myPalette instanceof Window){
			myPalette.center();
			myPalette.show();
		}
	}
	mainUI(this);
 }