package app.minimarket.pos;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Paint;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
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
        recognizer.process(InputImage.fromBitmap(bitmap, 0))
                .addOnSuccessListener(result -> {
                    Bitmap enhanced = createEnhancedBitmap(bitmap);
                    recognizer.process(InputImage.fromBitmap(enhanced, 0))
                            .addOnSuccessListener(enhancedResult -> {
                                JSObject response = new JSObject();
                                response.put("text", mergeText(result, enhancedResult));
                                call.resolve(response);
                            })
                            .addOnFailureListener(error -> {
                                // Keep the original OCR result if enhancement cannot be read.
                                JSObject response = new JSObject();
                                response.put("text", result.getText());
                                call.resolve(response);
                            })
                            .addOnCompleteListener(task -> {
                                recognizer.close();
                                bitmap.recycle();
                                enhanced.recycle();
                            });
                })
                .addOnFailureListener(error ->
                        call.reject("Não foi possível ler o texto da embalagem."))
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        recognizer.close();
                        bitmap.recycle();
                    }
                });
    }

    private Bitmap createEnhancedBitmap(Bitmap source) {
        int width = Math.round(source.getWidth() * 1.25f);
        int height = Math.round(source.getHeight() * 1.25f);
        Bitmap enhanced = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(enhanced);
        ColorMatrix grayscale = new ColorMatrix();
        grayscale.setSaturation(0f);
        ColorMatrix contrast = new ColorMatrix(new float[] {
                1.18f, 0, 0, 0, -18,
                0, 1.18f, 0, 0, -18,
                0, 0, 1.18f, 0, -18,
                0, 0, 0, 1, 0
        });
        grayscale.postConcat(contrast);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        paint.setColorFilter(new ColorMatrixColorFilter(grayscale));
        canvas.drawBitmap(source, null, new android.graphics.Rect(0, 0, width, height), paint);
        return enhanced;
    }

    private String mergeText(Text original, Text enhanced) {
        java.util.LinkedHashMap<String, String> lines = new java.util.LinkedHashMap<>();
        addLines(lines, original.getText());
        addLines(lines, enhanced.getText());
        return android.text.TextUtils.join("\n", lines.values());
    }

    private void addLines(java.util.LinkedHashMap<String, String> output, String text) {
        for (String line : text.split("\\R")) {
            String trimmed = line.trim();
            String key = java.text.Normalizer.normalize(trimmed, java.text.Normalizer.Form.NFD)
                    .replaceAll("\\p{M}", "")
                    .toLowerCase(java.util.Locale.ROOT)
                    .replaceAll("[^a-z0-9]", "");
            if (!key.isEmpty()) output.putIfAbsent(key, trimmed);
        }
    }

}
