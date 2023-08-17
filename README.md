Инструкция по запуску приложения REST-API (Node.js -> Express.js):

Тех.стек: Node.js, Express.js

Список необходимых зависимостей: 1.express - для развёртывания и запуска сервера на Node.js. 2.mysql - обеспечивает взаимодействие с БД MySQL. 3.bcrypt - используется в шифрование и дешифрование строк. 4.jsonwebtoken - используется в работе с токеном. 5.multer - используется в работе с файлами. 6.cors - позволяет предоставить веб-страницам доступ к ресурсам другого домена. 7. body-parser - парсит данные полученные с json объектов.


Для развёртывания необходимо установить MySQL 8.0.34 (https://dev.mysql.com/downloads/mysql/) и рекомендую для удобного использования оболочку MySQL 8.0.34 Workbench (https://dev.mysql.com/downloads/workbench/).

Далее необходимо установить Node.js с официального сайта (https://nodejs.org/ru) и желательно установить вместе с npm (node package manager). После запустить терминал в рабочей папке проекта и установить все необходимые выше перечисленные зависимости командой:

npm i

После успешной установки всех необходимых зависимостей, необходимо открыть файл config.json и заполнить все необходимые для работы переменные:
1."secretKey" - создайте свой секретный ключ, используется в зависимости (jsonwebtoken) для создание "токенов".
2."PORT" - можете оставить по стандарту порт на котором открывается 3000.
3."host_name" - вводите имя пользователя созданного в mysql configurator.
4."host_password" - введите пароль от пользователя созданного в mysql configurator.
5."host_db" - введите название базы данных в которой будете работать.
6."upload_dir" - папка в которой будет взаимодействие с файлами. ВАЖНО!!! ДЛЯ КОРРЕКТНОЙ РАБОТЫ СОЗДАЙТЕ ПАПКУ В ДИРЕКТОРИИ ПРОЕКТА и передайте в эту переменную название папки.

Создание БД MySQL:
Имя можете использовать любое. Для корректной работы нам понадобится создать две таблицы в БД. 
1.users - для взаимодействия с пользователем (создание, вход, вывод информации и др.).
Создаётся следующей командой:
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  refresh_token VARCHAR(255),
  access_token VARCHAR(255),
  refresh_token_expiresAt BIGINT,
  access_token_expiresAt BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

2.files - для взаимодействия с файлами (загрузка, изменение, удаление и др.).
Создаётся следующей командой:
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  extension VARCHAR(10),
  mime_type VARCHAR(100),
  name_in_file VARCHAR(255),
  size BIGINT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

После того как вы создали БД и передали все данные в файл config.json. Запустите терминал в папке проекта и запустить приложение через команду:

node index.js

Далее можете взаимодействовать со всеми маршрутами, рекомендую удобное приложения для взаимодействия с запросами с API Postman (https://www.postman.com/).

Список маршрутов (Routes List):
AUTH

auth/signup POST - создание пользователя, необходимо указать "email" и "password" в передаваемом json объекте. При успехе вернёт пару Токенов и время действия Access токена.

auth/signin POST - вход пользователя, необходимо указать "email" и "password" в передаваемом json объекте. При успехе обновит пару Токенов и время действия Access токена.

auth/signin/new_token POST - обновление Access токена, необходимо указать "email" в передаваемом json объекте и в request headers Authorization Bearer token - Refresh token. При успехе обновит сам Access токен и его время действие.

auth/info GET - информацию о пользователе, а именно его почту/логин, необходимо указать в request headers Authorization Bearer token - Access token. При успехе выведет json объект с email/логином пользователя.

auth/logout GET - выход из уч.записи пользователя, необходимо ввести в request headers Authorization Bearer token - Access token. При успехе выведет "Logged out successfully".


FILES

files/file/upload POST - загружает в созданную вами папку "upload_dir" любой указанный файл и добавляет о нём информацию в БД, необходимо выбрать form-data как вид передаваемого сообщения и выбрать в Key тип File вводите в поле Key - file, далее выбираете file который хотите загрузить отправляете. При успехе в папке "upload_dir" с вашим названием появится файл, а также выведет "File uploaded successfully".

files/file/list GET - Выводит всю информацию о загруженных файлах, ничего не нужно вводите просто отправляете запрос. При успехе выведет информацию о загруженных файлах.

files/file/delete/:id DELETE - Удаляет необходимый файл по указанному id, необходимо в маршруте указать id файла. При успехе выведет "File deleted successfully"

files/file/:id GET - Выводит информацию по определенному файлу выбранному по введённому id в маршруте. При успехе выведет информацию по данному файлу.

files/file/download/:id GET - Скачивает файл по выбранный файл по введенному id в маршруте и необходимо выбрать не Send, а Send and Download. При успехе скачает файл и вы сохраните в любое место на диске.

filest/file/update/:id PUT - Заменяет выбранный вами файл, на файл ранее загруженный в папке "upload_dir" по выбранному id пользователя в маршруте. При успехе заменит файл и обновит запись в БД, а также выведет "File updated successfully".
