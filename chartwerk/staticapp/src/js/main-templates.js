import List from 'list.js';
import marked from 'marked';
import $ from 'jquery';

// Enable smart quotes
marked.setOptions({
  smartypants: true,
});

const options = {
  valueNames: [
    'title', 'count',
  ],
};

const templateList = new List('items', options);

templateList.sort('count', { order: 'desc' });

$('.fa-info').click((e) => {
  const content = $(e.currentTarget).data('content');
  const title = $(e.currentTarget).data('title');
  if (content) {
    $('#infobox .content').html(
      `<h1>${title}</h1>${marked(content)}`
    );
  } else {
    $('#infobox .content').html(
      `<h1>${title}</h1>
    <p>No further description available
      for this template, yet.
      Check back soon!</p>`
    );
  }
  $('#infobox').addClass('open');
});

$('#infobox .fa-times').click(() => $('#infobox').removeClass('open'));
