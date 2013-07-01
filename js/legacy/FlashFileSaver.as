package {
  import flash.system.Security;
  import flash.events.Event;
  import flash.events.MouseEvent;
  import flash.net.FileReference;
  import flash.display.*;
  import flash.utils.ByteArray;
  import flash.external.ExternalInterface;
  import com.dynamicflash.util.Base64;
  import flash.geom.Rectangle;
  
  import flash.text.TextField;
  
  public class FlashFileSaver extends Sprite {
    
    private var file:FileReference = new FileReference();
    private var bytes:ByteArray;
    private var filename:String;
    
    public function FlashFileSaver() {
		Security.allowDomain('*');
		stage.align = StageAlign.TOP_LEFT;
		stage.scaleMode = StageScaleMode.NO_SCALE;
		//var textField:TextField = new TextField();
		var sprite:Sprite = new Sprite();
		sprite.graphics.clear();
        sprite.graphics.beginFill(0xD4D4D4, 0);
        sprite.graphics.drawRoundRect(0, 0, 500, 100, 0, 0); // x, y, width, height, ellipseW, ellipseH
        sprite.graphics.endFill();
		addChild(sprite); // just needed for enabling clicks on the sprite (which seems to be not possible, if it is empty)

		this.buttonMode = true;
		this.addEventListener(MouseEvent.CLICK, onMouseClickEvent);
		ExternalInterface.addCallback("provideDownload", provideDownload);
    }
    
    private function provideDownload(data:String, name:String): void {
    		bytes = Base64.decodeToByteArray(data);
	 		filename = name;
    }
    
    protected function onMouseClickEvent(event:Event):void{
		file.save(bytes, filename);
		//bytes = null;
    }
  }
}