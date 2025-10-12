from flask import Flask, request, send_file, jsonify
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
import io

app = Flask(__name__)

@app.route('/generate-pptx', methods=['POST'])
def generate_pptx():
    try:
        data = request.get_json()
        slides_data = data.get('slides', [])  # Ожидаем {'slides': [{'title': '...', 'bullets': [...], 'note': '...'}, ...]}

        if not slides_data:
            return jsonify({'error': 'No slides data provided'}), 400

        prs = Presentation()
        title_slide_layout = prs.slide_layouts[6]  # Blank layout для простоты

        for slide_info in slides_data:
            slide = prs.slides.add_slide(title_slide_layout)

            # Заголовок слайда
            title_shape = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(1))
            title_frame = title_shape.text_frame
            title_frame.text = slide_info.get('title', 'Untitled Slide')
            title_p = title_frame.paragraphs[0]
            title_p.font.size = Pt(32)
            title_p.alignment = PP_ALIGN.CENTER

            # Bullet points
            left = Inches(0.8)
            top = Inches(1.5)
            width = Inches(8)
            height = Inches(5)
            body_shape = slide.shapes.add_textbox(left, top, width, height)
            body_frame = body_shape.text_frame
            for bullet in slide_info.get('bullets', []):
                p = body_frame.add_paragraph()
                p.text = '• ' + bullet
                p.font.size = Pt(18)
                p.level = 0

            # Заметки (notes)
            if slide_info.get('note'):
                notes_slide = slide.notes_slide
                notes_frame = notes_slide.notes_text_frame
                notes_frame.add_paragraph().text = slide_info['note']

        # Сохраняем в BytesIO (in-memory, без файловой системы)
        pptx_buffer = io.BytesIO()
        prs.save(pptx_buffer)
        pptx_buffer.seek(0)

        return send_file(
            pptx_buffer,
            mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation',
            as_attachment=True,
            download_name='lesson_slides.pptx'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)