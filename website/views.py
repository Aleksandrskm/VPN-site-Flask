from flask import Blueprint, render_template, send_from_directory, current_app, jsonify
import os

views = Blueprint("views", __name__)


@views.route('/')
def index():
    """Главная страница приложения"""
    return render_template('index.html')


# МАРШРУТЫ ДЛЯ СТАТИЧЕСКИХ ФАЙЛОВ (ВАЖНО!)
@views.route('/css/<path:filename>')
def serve_css(filename):
    """Обслуживание CSS файлов"""
    return send_from_directory(os.path.join(current_app.static_folder, 'css'), filename)


@views.route('/js/<path:filename>')
def serve_js(filename):
    """Обслуживание JavaScript файлов"""
    return send_from_directory(os.path.join(current_app.static_folder, 'js'), filename)


@views.route('/js/api/<path:filename>')
def serve_js_api(filename):
    """Обслуживание JavaScript файлов из папки api"""
    return send_from_directory(os.path.join(current_app.static_folder, 'js', 'api'), filename)


@views.route('/js/contexts/<path:filename>')
def serve_js_contexts(filename):
    """Обслуживание JavaScript файлов из папки contexts"""
    return send_from_directory(os.path.join(current_app.static_folder, 'js', 'contexts'), filename)


@views.route('/js/components/<path:filename>')
def serve_js_components(filename):
    """Обслуживание JavaScript файлов из папки components"""
    return send_from_directory(os.path.join(current_app.static_folder, 'js', 'components'), filename)


@views.route('/js/utils/<path:filename>')
def serve_js_utils(filename):
    """Обслуживание JavaScript файлов из папки utils"""
    return send_from_directory(os.path.join(current_app.static_folder, 'js', 'utils'), filename)


# ОСТАЛЬНЫЕ ВАШИ МАРШРУТЫ
@views.route('/azimuth_and_elevation_angle')
def function_az():
    return render_template('azimuth_and_elevation_angle.html')


@views.route('/get_coordinates')
def function_get():
    return render_template('get_coordinates.html')


@views.route('/communication_availability')
def function_com():
    return render_template('communication_availability.html')


@views.route('/viewing_tables')
def function_view():
    return render_template('viewing_tables.html')


@views.route('/pars_TLE')
def function_parse():
    return render_template('pars_TLE.html')


@views.route('/monotonous_time_service')
def function_mon_time():
    return render_template('monotonous_time_service.html')


@views.route('/abonents')
def function_abonents():
    return render_template('abonents.html')


@views.route('/maps_territorial_districts')
def function_maps():
    return render_template('maps_territorial_districts.html')


@views.route('/subsystem_of calibration_beams')
def function_beams():
    return render_template('subsystem_of calibration_beams.html')


@views.route('/plan_ochr')
def function_plan_ochr():
    return render_template('plan_ochr.html')


@views.route('/edit_KA')
def function_edit_KA():
    return render_template('edit_Ka.html')


@views.route('/system-for-view-curr-sessions')
def function_system_for_view_curr_sessions():
    return render_template('system-for-view-curr-sessions.html')


@views.route('/check-static')
def check_static():
    """Маршрут для проверки наличия статических файлов"""
    static_folder = current_app.static_folder
    js_folder = os.path.join(static_folder, 'js')

    result = {
        'static_folder_exists': os.path.exists(static_folder) if static_folder else False,
        'js_folder_exists': os.path.exists(js_folder) if js_folder else False,
        'static_folder': static_folder,
        'files': {}
    }

    if static_folder and os.path.exists(static_folder):
        # Проверим основные файлы
        files_to_check = [
            'js/api/config.js',
            'js/app.js',
            'css/main.css',
            'css/components.css',
            'css/modules.css'
        ]

        for file_path in files_to_check:
            full_path = os.path.join(static_folder, file_path)
            result['files'][file_path] = os.path.exists(full_path)

    return jsonify(result)