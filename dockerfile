FROM node:lts
EXPOSE 80
EXPOSE 443
ENV port=80
COPY broadcaster/dist/ /opt/tracker/
COPY broadcaster/package.json /opt/tracker/
WORKDIR /opt/tracker
RUN npm i
# RUN ls
ENTRYPOINT [ "node", "/opt/tracker/app.js" ]

