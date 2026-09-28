package app.minimarket.pos;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

@CapacitorPlugin(name = "OfflineOcr")
public class OfflineOcrPlugin extends Plugin {
    private Bitmap decodeImage(PluginCall call) {
        String imageBase64 = call.getString("imageBase64");
        if (imageBase64 == null || imageBase64.isEmpty()) {
            call.reject("A imagem da câmera não foi recebida.");
            return null;
        }

        try {
            byte[] imageBytes = Base64.decode(imageBase64, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
            if (bitmap == null) call.reject("A imagem da câmera está inválida.");
            return bitmap;
        } catch (IllegalArgumentException error) {
            call.reject("Não foi possível ler a imagem da câmera.");
            return null;
        }
    }

    @PluginMethod
    public void recognizeText(PluginCall call) {
        final Bitmap bitmap = decodeImage(call);
        if (bitmap == null) return;

        final TextRecognizer recognizer =
                TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        final OnCompleteListener<Text> cleanup = task -> {
            recognizer.close();
            bitmap.recycle();
        };

        recognizer.process(InputImage.fromBitmap(bitmap, 0))
                .addOnSuccessListener(result -> {
                    JSObject response = new JSObject();
                    response.put("text", result.getText());
                    call.resolve(response);
                })
                .addOnFailureListener(error ->
                        call.reject("Não foi possível ler o texto da embalagem."))
                .addOnCompleteListener(cleanup);
    }

}
