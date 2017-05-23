import List from 'list.js';
import marked from 'marked';
import $ from 'jquery';
import listPagination from './../../node_modules/list.pagination.js/dist/list.pagination.min.js';


// Enable smart quotes
marked.setOptions({
  smartypants: true,
});

const options = {
  valueNames: [
    'title',
    'type',
    'created',
    'author',
  ],
  page: 20,
  plugins: [listPagination({})],
};

const chartList = new List('items', options);

chartList.sort('created', { order: 'desc' });

$('.chart-text .chatter, .chart-text .headline')
  .html(function () {
    return marked.inlineLexer($(this).data('text'), []);
  });
