.ui-icon {
    display: inline-block;
    background-image: url("../images/icon.png");
}

{{#sprites}}
.icon-{{name}} {
    background-position: {{px.offset_x}} {{px.offset_y}};
    width: {{px.width}};
    height: {{px.height}};
}
{{/sprites}}