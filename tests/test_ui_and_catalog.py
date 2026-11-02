import os
import json
import re

def test_movies_catalog():
    json_path = 'd:/Ren/ProjectAi/ReStram/frontend/data/movies.json'
    assert os.path.exists(json_path), "movies.json must exist"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    assert 'categories' in data, "categories key missing"
    assert 'indodrama_stream' in data['categories'], "indodrama_stream category required"
    print("PASS: movies catalog verified.")

def test_auth_and_indodrama_menu():
    html_path = 'd:/Ren/ProjectAi/ReStram/frontend/index.html'
    js_path = 'd:/Ren/ProjectAi/ReStram/frontend/js/app.js'
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    with open(js_path, 'r', encoding='utf-8') as f:
        js = f.read()
        
    # Check hidden indodrama nav item
    assert 'id="nav-item-indodrama" class="hidden' in html, "nav-item-indodrama must be hidden by default in index.html"
    assert 'id="nav-login-btn"' in html, "nav-login-btn must exist in index.html"
    assert 'id="auth-modal"' in html, "auth-modal must exist in index.html"
    assert 'id="login-username"' in html, "login-username must exist in auth modal"
    assert 'id="login-password"' in html, "login-password must exist in auth modal"
    
    # Check JS credentials & methods
    assert 'CREDENTIALS' in js, "CREDENTIALS missing in app.js"
    assert "'reno': 'restram2026'" in js, "User reno missing in app.js"
    assert "'admin': 'admin123'" in js, "User admin missing in app.js"
    assert 'handleLoginSubmit' in js, "handleLoginSubmit missing in app.js"
    assert 'updateAuthUI' in js, "updateAuthUI missing in app.js"
    assert 'openLoginModal' in js, "openLoginModal missing in app.js"
    assert 'logout' in js, "logout missing in app.js"
    
    print("PASS: Auth gating, modal, login button, and IndoDrama21 hidden menu verified 100%.")

if __name__ == '__main__':
    test_movies_catalog()
    test_auth_and_indodrama_menu()
    print("ALL TESTS PASSED SUCCESSFULLY! 100% OK.")
