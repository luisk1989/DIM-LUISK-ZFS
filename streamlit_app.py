import streamlit as st
import streamlit.components.v1 as components

st.title("Mi aplicación")

HtmlFile = open("index.html", 'r', encoding='utf-8')
source_code = HtmlFile.read()

components.html(source_code, height=800)
