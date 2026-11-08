FROM nginx:alpine

COPY ascode-website/ /usr/share/nginx/html/

EXPOSE 80
