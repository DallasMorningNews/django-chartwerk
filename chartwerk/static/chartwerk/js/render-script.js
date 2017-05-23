if (chartwerk.ui.size === 'single') {
  $('#chartwerk').addClass('single');
}


marked.setOptions({
  smartypants: true,
});

$('#chartwerk #headline').html(marked.inlineLexer(chartwerk.text.headline, []));
$('#chartwerk #chatter').html(marked.inlineLexer(chartwerk.text.chatter, []));
$('#chartwerk #footnote').html(marked.inlineLexer(chartwerk.text.footnote, []));
$('#chartwerk #source').html(marked.inlineLexer(chartwerk.text.source, []));
$('#chartwerk #author').html(marked.inlineLexer(chartwerk.text.author, []));

// Annotations...
function renderAnnotations(){
  var chart = $('#chart');
  chart.css({ position: 'relative' });

  chartwerk.text.annotations.map(function(d, i) {
    if (
      (d.size === 's' && chartwerk.ui.size === 'double') ||
      (d.size === 'd' && chartwerk.ui.size === 'single')
    ) {
      return false;
    }

    var text = d.text === '' ? 'Add text' :
        marked.inlineLexer(d.text, []);


    var editable = '<div class="annotation label" data-id="'+i+'"><div class="inner center"> <p>'+text+'</p></div></div>';

    $(editable)
      .css({
        position: 'absolute',
        left: d.x,
        top: d.y,
        width: d.w,
        height: 'auto',
        color: d.color || 'black',
      })
      .addClass(function() {
        var cls = d.align + ' ' + d.fontSize;
        cls = d.background ? cls + ' bg' : cls;
        return cls;
      })
      .appendTo(chart);
  });
}

renderAnnotations();
