from datetime import datetime

from flask import (
    Flask,
    abort,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask.ext.stormpath import (
    StormpathError,
    StormpathManager,
    User,
    login_required,
    login_user,
    logout_user,
    user,
)


app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'some_really_long_random_string_here'
app.config['STORMPATH_API_KEY_FILE'] = 'apiKey.properties'
app.config['STORMPATH_APPLICATION'] = 'CSRF'

stormpath_manager = StormpathManager(app)


##### EVIL.COM #####
@app.route('/evil')
def attack():
    return render_template('evil.html')


##### TWEETER #####
@app.route('/tweeter')
def tweet():
    return render_template('tweeter.html')


##### FAYCEBOOK #####
def faycebook_posts(template):
    posts = []
    for account in stormpath_manager.application.accounts:
        if account.custom_data.get('posts'):
            posts.extend(account.custom_data['posts'])
    posts = sorted(posts, key=lambda k: k['date'], reverse=True)
    return render_template(template, posts=posts)

@app.route('/faycebook')
def facebook():
  return faycebook_posts('faycebook.html')

@app.route('/show_posts')
def show_posts():
  return faycebook_posts('show_posts.html')


@app.route('/faycebook/add', methods=['POST'])
@login_required
def add_post():
    if not user.custom_data.get('posts'):
        user.custom_data['posts'] = []

    user.custom_data['posts'].append({
        'date': datetime.utcnow().isoformat(),
        'user': request.form['user'],
        'status': request.form['status'],
    })
    user.save()
    flash('New post successfully added.')
    return redirect(url_for('show_posts'))


@app.route('/faycebook/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        try:
            _user = User.from_login(
                request.form['email'],
                request.form['password'],
            )
            login_user(_user, remember=True)
            flash('You were logged in.')
            return redirect(url_for('show_posts'))
        except StormpathError, err:
            error = err.message
    return render_template('login.html', error=error)


@app.route('/faycebook/logout')
def logout():
    logout_user()
    flash('You were logged out.')
    return redirect(url_for('show_posts'))



if __name__ == '__main__':
    app.run()
