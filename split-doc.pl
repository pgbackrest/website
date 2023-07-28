#!/usr/bin/env perl

use v5.38;

no warnings qw(experimental::builtin);
use builtin qw(trim);

use Mojo::DOM;
use Path::Tiny;

my $fn = shift or die "usage: $0 <html-file>\n";
my $f = path($fn);

my $dom = Mojo::DOM->new($f->slurp_utf8);
my $toc = $dom->find('div.page-toc-body')->first;
my $title = trim($dom->find('title')->first->text);
my $footer = $dom->find('div.page-footer')->first;

# template for the new pages
my $new_dom = Mojo::DOM->new($f->slurp_utf8);

# split out the sections
for my $sect ($dom->find('div.section1')->each) {
    # we want to leave the introduction section in place,
    # and handily it doesn't have a <span class="id">
    my $name = $sect
        ->find('div.section1-title > span.id')
        ->map('text')->first or next;

    # update the title and replace the body with the section and footer
    $new_dom->find('title')->first->content("$title: $name");
    $new_dom->find('meta[property="og:title"]')->first->attr(content => "$title: $name");
    $new_dom->find('body')->first->content($sect)->append_content($footer);

    my $new_fn = $fn =~ s/\./-$name./r;
    path($new_fn)->spew_utf8($new_dom);

    # fix up the TOC entries
    my $id = $sect->find('div.section1 > a[id]')->first->{id};
    $toc->find(qq{a[href="#$id"]})->first->attr(href => $new_fn);

    # and sub-section links
    for my $link ($toc->find(qq{a[href^="#$id/"]})->each) {
        $link->attr(href => "$new_fn$link->{href}");
    }

    $sect->remove;
}

$f->spew_utf8($dom);
