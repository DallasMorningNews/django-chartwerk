import List from 'list.js';
import marked from 'marked';
import $ from 'jquery';

// Enable smart quotes
marked.setOptions({
  smartypants: true,
});

const options = {
  valueNames: [
    'title',
    'type',
    'created',
  ],
};

const chartList = new List('items', options);

chartList.sort('created', { order: 'desc' });

$('.chart-text .chatter, .chart-text .headline')
  .html(function () {
    return marked.inlineLexer($(this).data('text'), []);
  });
