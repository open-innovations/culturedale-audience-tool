#!/usr/bin/perl

use warnings;
use strict;
use JSON::XS;
use Data::Dumper;
use Cwd qw(abs_path);
my $scriptdir = "./";
my $lib;
BEGIN {
	if(abs_path($0) =~ /^(.*\/)[^\/]*/){ $scriptdir = $1; }
	$lib = $scriptdir."lib/";
}
use lib $lib;
use utf8;

my $config = getCommandLineOpts();
my $file = $config->{'args'}[0]||"../../../Geography/NSPL/NSPL_2021_AUG_2024/Data/NSPL21_AUG_2024_UK.csv";
my @categories = split(",",$config->{'c'}||"laua,ward,lsoa21");

if(!-e $file){
	print "The National Statistics Postcode Lookup doesn't seem to exist. Please download a copy from e.g.:\n";
	print "https://geoportal.statistics.gov.uk/datasets/e832e833fe5f45e19096800af4ac800c/about\n";
	print "And save it as $file\n";
	exit;
}




my (@cat,$c,$counter,$pcs,$pcd,@cols,$header,@headers,$i,%headerlookup,$oldarea,$area,$district,$unit,$bit,$lastbit);
for($c = 0; $c < @categories; $c++){ $cat[$c] = -1; }

#pcd,pcd2,pcds,dointr,doterm,usertype,oseast1m,osnrth1m,osgrdind,oa21,cty,ced,laua,ward,nhser,ctry,rgn,pcon,ttwa,itl,npark,lsoa21,msoa21,wz11,sicbl,bua22,ru11ind,oac11,lat,long,lep1,lep2,pfa,imd,icb
#"AB1 0AA","AB1  0AA","AB1 0AA","198001","199606","0","385386","0801193","1","S00137176","S99999999","S99999999","S12000033","S13002843","S99999999","S92000003","S99999999","S14000061","S22000047","S30000026","S99999999","","","S34002990","S03000012","S99999999","3","1C3",57.101474,-2.242851,"S99999999","","S23000009",6715,"S99999999"
$counter = 0;
open(FILE,$file);
# Regex for postcodes ([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})
while(my $line = <FILE>){

	$line =~ s/\"//g;
	(@cols) = split(/,/,$line);
	
	if(!$header){
		$header = $line;
		@headers = @cols;
		for($i = 0; $i < @headers; $i++){
			$headerlookup{$headers[$i]} = $i;
			for($c = 0; $c < @categories; $c++){
				if($headers[$i] eq $categories[$c]){ $cat[$c] = $i; }
			}
		}

	}else{
	
		$pcd = $cols[$headerlookup{'pcd'}];
		$pcd =~ s/ +/ /g;
		if($pcd =~ /^([A-Z]{1,2})([0-9]+)\s?([0-9][A-Z0-9]+)$/){
			$area = $1;
			$district = $1.$2;
			$unit = $3;
		}

#print "Postcode $pcd/$area/$district/$unit\n";
		if($area){
			if(!defined($pcs->{$area})){
				$pcs->{$area} = {};
			}
			if(!defined($pcs->{$area})){
				$pcs->{$area}{$district} = {};
			}
			$pcs->{$area}{$district}{$unit} = [];
			for($c = 0; $c < @categories; $c++){
				push(@{$pcs->{$area}{$district}{$unit}},$cols[$cat[$c]]);
			}

			if($oldarea && $area ne $oldarea){
				SaveJSON($pcs->{$oldarea},$oldarea.".json", 1);
			}
			$oldarea = $area;
		}
	}
	$counter++;
}
close(FILE);

SaveJSON($pcs->{$oldarea},$oldarea.".json", 1);


############
sub msg {
	my $str = $_[0];
	my $dest = $_[1]||"STDOUT";
	
	my %colours = (
		'black'=>"\033[0;30m",
		'red'=>"\033[0;31m",
		'green'=>"\033[0;32m",
		'yellow'=>"\033[0;33m",
		'blue'=>"\033[0;34m",
		'magenta'=>"\033[0;35m",
		'cyan'=>"\033[0;36m",
		'white'=>"\033[0;37m",
		'none'=>"\033[0m"
	);
	foreach my $c (keys(%colours)){ $str =~ s/\< ?$c ?\>/$colours{$c}/g; }
	if($dest eq "STDERR"){
		print STDERR $str;
	}else{
		print STDOUT $str;
	}
}

sub error {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1<red>ERROR:<none> /;
	msg($str,"STDERR");
}

sub warning {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1<yellow>WARNING:<none> /;
	msg($str,"STDERR");
}

sub ParseJSON {
	my $str = shift;
	my $json = {};
	if(!$str){ $str = "{}"; }
	eval {
		$json = JSON::XS->new->decode($str);
	};
	if($@){ error("\tInvalid output.\n"); }
	return $json;
}

sub LoadJSON {
	my (@files,$str,@lines,$json);
	my $file = $_[0];
	open(FILE,"<:utf8",$file);
	@lines = <FILE>;
	close(FILE);
	$str = (join("",@lines));
	# Error check for JS variable e.g. South Tyneside https://maps.southtyneside.gov.uk/warm_spaces/assets/data/wsst_council_spaces.geojson.js
	$str =~ s/[^\{]*var [^\{]+ = //g;
	return ParseJSON($str);
}

# Version 1.1.1
sub SaveJSON {
	my $json = shift;
	my $file = shift;
	my $depth = shift;
	my $oneline = shift;
	if(!defined($depth)){ $depth = 0; }
	my $d = $depth+1;
	my ($txt,$fh);

	$txt = JSON::XS->new->canonical(1)->pretty->space_before(0)->encode($json);
	$txt =~ s/   /\t/g;
	$txt =~ s/\n\t{$d,}//g;
	$txt =~ s/\n\t{$depth}([\}\]])(\,|\n)/$1$2/g;
	$txt =~ s/": /":/g;

	if($oneline){
		$txt =~ s/\n[\t\s]*//g;
	}

	msg("Save JSON to <cyan>$file<none>\n");
	open($fh,">:utf8",$file);
	print $fh $txt;
	close($fh);

	return $txt;
}

# v0.1
sub getCommandLineOpts {
	my $data = {'args'=>[]};
	for(my $i = 0; $i < @ARGV; $i++){
		if($ARGV[$i] =~ /^\-\-?(.*)/){
			$data->{$1} = $ARGV[++$i];
		}else{
			push(@{$data->{'args'}},$ARGV[$i]);
		}
		
	}
	return $data;
}